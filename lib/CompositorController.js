/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "VirtualTimeController" }]*/

const {VirtualTimeController, VirtualTimeContinuePolicy, VirtualTimeStartPolicy, VirtualTimeRepeatingTask} = require('./VirtualTimeController');

/**
 * Issues BeginFrames (Chromium's vsync signal) while virtual time advances and takes screenshots.
 */
class CompositorController {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!VirtualTimeController} virtualTimeController
   * @param {!Object} options
   */
  constructor(client, virtualTimeController, options) {
    this._client = client;
    this._virtualTimeController = virtualTimeController;

    /** @type {number} Specifies the virtual time between individual BeginFrames while virtual time advances. */
    this._animationBeginFrameInterval = options.animationBeginFrameInterval || 100;

    /** @type {boolean} If false, animation BeginFrames will not commit or draw visual updates to the display. This can be used to reduce the overhead of such BeginFrames in the common case that screenshots will be taken from separate BeginFrames. */
    this._updateDisplayForAnimations = options.updateDisplayForAnimations || true;

    client.on('HeadlessExperimental.needsBeginFramesChanged', event => this._needsBeginFramesChanged(event));
    client.send('HeadlessExperimental.enable', {});

    const controller = this;
    this._animation_task = new class extends VirtualTimeRepeatingTask {
      constructor() {
        super();
        this._continueCallback = null;
        this._needsBeginFrameOnVirtualTimeResume = true;

        virtualTimeController.setResumeDeferrer(this.deferResume.bind(this));
        virtualTimeController.scheduleRepeatingTask(
            this, controller._animationBeginFrameInterval, -1,
            VirtualTimeStartPolicy.START_IMMEDIATELY);
        // Note we wait for something else to actually start virtual time
      }

      /**
       * @param {number} virtualTimeOffset
       * @param {!function(!string)} continueCallback
       */
      intervalElapsed(virtualTimeOffset, continueCallback) {
        this._needsBeginFrameOnVirtualTimeResume = true;
        continueCallback(VirtualTimeContinuePolicy.NOT_REQUIRED);
      }

      /** @param {!function()} continueCallback */
      deferResume(continueCallback) {
        // Run a BeginFrame if we cancelled it because the budged expired previously
        // and no other BeginFrame was sent while virtual time was paused.
        if (this._needsBeginFrameOnVirtualTimeResume) {
          this._continueCallback = continueCallback;
          this._issueAnimationBeginFrame();
          return;
        }
        continueCallback();
      }

      compositorControllerIssuingScreenshotBeginFrame() {
        // The screenshotting BeginFrame will replace our animation-only BeginFrame.
        // We cancel any pending animation BeginFrame to avoid sending two
        // BeginFrames within the same virtual time pause.
        this._needsBeginFrameOnVirtualTimeResume = false;
      }

      _issueAnimationBeginFrame() {
        this._needsBeginFrameOnVirtualTimeResume = false;
        let updateDisplay = controller._updateDisplayForAnimations;
        // Display needs to be updated for first BeginFrame. Otherwise, the
        // RenderWidget's surface may not be created and the root surface may block
        // waiting for it forever.
        if (controller._lastBeginFrameTime === 0)
          updateDisplay = true;
        controller._postBeginFrame(this._beginFrameComplete.bind(this), !updateDisplay);
      }

      _beginFrameComplete() {
        if (this._beginFrameComplete) {
          this._continueCallback();
          this._continueCallback = null;
        }
      }
    }();

    this._compositorReadyCallback = null;

    /** @type {function(*)} */
    this._beginFrameCompleteCallback = null;

    this._mainFrameContentUpdatedCallback = null;
    this._screenshotCapturedCallback = null;
    this._idleCallback = null;
    this._lastBeginFrameTime = 0;
    this._waitForCompositorReadyBeginFrameTask = null;
    this._needsBeginFrames = false;
    this._mainFrameReady = false;
  }

  /**
   * Returns a promise that is resolved when no BeginFrames are in flight.
   */
  waitUntilIdle() {
    if (!this._beginFrameCompleteCallback)
      return Promise.resolve();
    return new Promise(resolve => this._idleCallback = resolve);
  }

  /**
   * Captures a screenshot by issuing a BeginFrame. |quality| is only valid for
   * jpeg format screenshots, in range 0..100. Should not be called again until
   * the promise has resolved. Should only be called while no other BeginFrame
   * is in flight and after the compositor is ready.
   *
   * @param {string} format
   * @param {number} quality A number between 1 and 100
   * @return {Promise<>} Promise that is resolved once the screen shot has been
   *    taken.
   */
  captureScreenshot(format, quality) {
    // Let AnimationTask know that it doesn't need to issue an animation BeginFrame for the
    // current virtual time pause.
    this._animation_task.compositorControllerIssuingScreenshotBeginFrame();

    const noDisplayUpdates = false;
    this._postBeginFrame(this._captureScreenshotBeginFrameComplete.bind(this), noDisplayUpdates, {format, quality});

    return new Promise(resolve => this._screenshotCapturedCallback = resolve);
  }

  sendFullBeginFrame() {
    // Let AnimationTask know that it doesn't need to issue an animation BeginFrame for the
    // current virtual time pause.
    this._animation_task.compositorControllerIssuingScreenshotBeginFrame();

    const noDisplayUpdates = false;
    let promiseResolveCallback;
    const promise = new Promise(resolve => promiseResolveCallback = resolve);
    this._postBeginFrame(promiseResolveCallback, noDisplayUpdates);
    return promise;
  }

  /**
   * Posts a BeginFrame as a new task to avoid nesting it inside the current callstack,
   * which can upset the compositor.
   *
   * @param {!function()} beginFrameCompleteCallback
   * @param {boolean} noDisplayUpdates
   * @param {Object} screenshot
   */
  _postBeginFrame(beginFrameCompleteCallback, noDisplayUpdates = false, screenshot = null) {
    // In certain nesting situations, we should not issue a BeginFrame immediately
    // - for example, issuing a new BeginFrame within a BeginFrameCompleted or
    // NeedsBeginFramesChanged event can upset the compositor. We avoid these
    // situations by issuing our BeginFrames from a separately posted task.
    setImmediate(this._beginFrame.bind(this, beginFrameCompleteCallback, noDisplayUpdates, screenshot));
  }

  /**
   * Issues a BeginFrame synchronously and runs |beginFrameCompleteCallback|
   * when done. Should not be called again until |beginFrameCompleteCallback| has run.
   *
   * @param {!function(*)} beginFrameCompleteCallback
   * @param {boolean} noDisplayUpdates
   * @param {Object} screenshot
   */
  _beginFrame(beginFrameCompleteCallback, noDisplayUpdates = false, screenshot = null) {
    this._beginFrameCompleteCallback = beginFrameCompleteCallback;
    if (this._needsBeginFrames || screenshot) {
      // Use virtual time for frame time, so that rendering of animations etc. is
      // aligned with virtual time progression.
      let frameTime = this._virtualTimeController.getCurrentVirtualTime();
      if (frameTime <= this._lastBeginFrameTime) {
        // Frame time cannot go backwards or stop, so we issue another BeginFrame
        // with a small time offset from the last BeginFrame's time instead.
        frameTime = this._lastBeginFrameTime + 0.001;
      }
      const epochAdjustment = 1519203783421.48;
      const params = {
        frameTime: frameTime + epochAdjustment,
        interval: this._animationBeginFrameInterval,
        noDisplayUpdates
      };
      if (screenshot)
        params.screenshot = screenshot;
      this._lastBeginFrameTime = frameTime;
      this._client.send('HeadlessExperimental.beginFrame', params).then(this._beginFrameComplete.bind(this));
    } else {
      this._beginFrameComplete(null);
    }
  }

  /**
   * Runs the |beginFrameCompleteCallback| and the |this._idleCallback| if set.
   * @param {*} result
   */
  _beginFrameComplete(result) {
    if (this._beginFrameCompleteCallback) {
      const callback = this._beginFrameCompleteCallback;
      this._beginFrameCompleteCallback = null;
      callback(result);
    }
    if (this._idleCallback) {
      const callback = this._idleCallback;
      this._idleCallback = null;
      callback();
    }
  }

  /**
   * @param {*} event
   */
  _needsBeginFramesChanged(event) {
    this._needsBeginFrames = event.needsBeginFrames;
  }

  _captureScreenshotBeginFrameComplete(beginFrameResult) {
    if (beginFrameResult && beginFrameResult.screenshotData) {
      const callback = this._screenshotCapturedCallback;
      this._screenshotCapturedCallback = null;
      callback(beginFrameResult.screenshotData);
    } else {
      // TODO(alexclarke): this should really be promise rejection.
      const callback = this._screenshotCapturedCallback;
      this._screenshotCapturedCallback = null;
      callback();
    }
  }
}

module.exports = CompositorController;
