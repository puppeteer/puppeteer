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

/**
 * @enum
 */
const VirtualTimeContinuePolicy = {
  CONTINUE_MORE_TIME_NEEDED: 'CONTINUE_MORE_TIME_NEEDED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  STOP: 'STOP',  // Note STOP trumps CONTINUE_MORE_TIME_NEEDED.
};

/**
 * @enum
 */
const VirtualTimeStartPolicy = {
  WAIT_FOR_NAVIGATION: 'WAIT_FOR_NAVIGATION',
  START_IMMEDIATELY: 'START_IMMEDIATELY',
};


/**
 * A task that's run at a specified virtual interval.
 *
 * @interface
 * @export
 */
class VirtualTimeRepeatingTask {

  /**
   * Called when the task's requested virtual time interval has elapsed.
   *
   * @param {number} virtualTimeOffset The time in virtual milliseconds since the renderer was created
   * @param {!function(!string)} continueCallback When the task has
   *    completed it's periodic work, it should call continueCallback with CONTINUE_MORE_TIME_NEEDED if
   *    it wants virtual time to continue, STOP if virtual time should stop now or NOT_REQUIRED otherwise.
   */
  intervalElapsed(virtualTimeOffset, continueCallback) {}
}

/**
 * An interface for observing when VirtualTime starts and stops.
 *
 * @interface
 * @export
 */
class VirtualTimeObserver {

  /**
   * Called when virtual time starts advancing.
   *
   * @param {number} virtualTimeOffset The time in virtual milliseconds since the renderer was created
   */
  virtualTimeStarted(virtualTimeOffset) {}

  /**
   * Called when virtual time stops because either all tasks have been canceled or one of them voted
   * to stop.
   *
   * @param {number} virtualTimeOffset The time in virtual milliseconds since the renderer was created
   */
  virtualTimeStopped(virtualTimeOffset) {}
}

/**
 * Used by VirtualTimeController to maintain a list of active VirtualTimeRepeatingTasks.
 */
class VirtualTimeTaskInfo {
  /**
   * @param {!VirtualTimeRepeatingTask} task
   * @param {number} interval
   * @param {number} priority
   * @param {!string} startPolicy
   * @param {number} nextExecutionTime
   */
  constructor(task, interval, priority, startPolicy, nextExecutionTime) {
    this.task = task;
    this.interval = interval;
    this.priority = priority;
    this.startPolicy = startPolicy;
    this.nextExecutionTime = nextExecutionTime;
    this.readyToAdvance = true;
    this.continuePolicy = VirtualTimeContinuePolicy.CONTINUE_MORE_TIME_NEEDED;
  }
}

/**
 * Controls how virtual time progresses. VirtualTimeRepeatingTask can register their interest to be
 * periodically notified about changes to the current virtual time.
 */
class VirtualTimeController {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client, deterministic) {
    this._client = client;

    this._repeatingTasks = [];

    this._observers = new Set();

    this._resumeDeferrer = null;

    this._virtualTimeBase = 10000;
    this._totalElapsedTimeOffset = 0;
    this._lastBudget = 0;

    this._virtualTimeStarted = false;
    this._virtualTimePaused = true;
    this._shouldSendStartNotification = false;
    this._inNotifyTasksAndAdvance = false;
    this._shutdown = false;

    client.on('Emulation.virtualTimeBudgetExpired', event => this._virtualTimeBudgetExpired(event));
  }

  /**
   * Interleaves execution of the provided |task| with progression of virtual
   * time. The task will be notified whenever another |interval| of virtual time
   * have elapsed, as well as when the last granted budget has been used up.
   *
   * To ensure that the task is notified of elapsed intervals accurately, it
   * should be added while virtual time is paused.
   *
   * @param {!VirtualTimeRepeatingTask} task The task to run every |interval| virtual milliseconds.
   * @param {number} interval The interval in virtual milliseconds in which |task| will be run.
   * @param {number} priority If multiple tasks are eligible to run at the same time, they are run in order of ascending priority
   * @param {!string} startPolicy Whether or not virtual time should begin immediately or after a navigation
   */
  scheduleRepeatingTask(task, interval, priority, startPolicy) {
    this.cancelRepeatingTask(task);
    const nextExecutionTime = this._totalElapsedTimeOffset + interval;
    this._repeatingTasks.push(new VirtualTimeTaskInfo(task, interval, priority, startPolicy, nextExecutionTime));
    this._repeatingTasks.sort(function(a, b) {
      return a.priority - b.priority;
    });
  }

  /**
   * @param {!VirtualTimeRepeatingTask} task The task to cancel.
   */
  cancelRepeatingTask(task) {
    for (let i = 0; i < this._repeatingTasks.length; i++) {
      if (this._repeatingTasks[i].task === task) {
        this._repeatingTasks.splice(i, 1);
        break;
      }
    }
  }

  /**
   * @param {!VirtualTimeObserver} observer
   */
  addObserver(observer) {
    this._observers.add(observer);
  }

  /**
   * @param {!VirtualTimeObserver} observer
   */
  removeObserver(observer) {
    this._observers.delete(observer);
  }


  /**
   * An API used by the CompositorController to defer the start of virtual time until it's ready.
   *
   * @param {!function(*)} resumeDeferrer
   */
  setResumeDeferrer(resumeDeferrer) {
    this._resumeDeferrer = resumeDeferrer;
  }

  /**
   * Shuts the VirtualTimeController down.
   */
  shutdown() {
    this._repeatingTasks = [];
    this._observers = new Set();
    this._resumeDeferrer = null;
    this._shutdown = true;
  }

  /**
   * @return {number} The current virtual time stamp. Only accurate while
   * virtual time is paused.
   */
  getCurrentVirtualTime() {
    return this._virtualTimeBase + this._totalElapsedTimeOffset;
  }

  /**
   * Signals that virtual time should start advancing. If virtual time is already running,
   * this does nothing.  When virtual time is ready to start the observers will be notified.
   *
   * If registered, the resumeDeferrer can delay the start until some action has completed.
   */
  startVirtualTime() {
    if (this._virtualTimeStarted || this._shutdown)
      return;

    let nextBudget = 0;
    let waitForNavigation = false;
    for (let i = 0; i < this._repeatingTasks.length; i++) {
      const repeatingTask = this._repeatingTasks[i];
      repeatingTask.readyToAdvance = true;
      if (repeatingTask.startPolicy === VirtualTimeStartPolicy.WAIT_FOR_NAVIGATION)
        waitForNavigation = true;
      const timeTillNextExecution = repeatingTask.nextExecutionTime - this._totalElapsedTimeOffset;
      if (nextBudget === 0)
        nextBudget = timeTillNextExecution;
      else
        nextBudget = Math.min(nextBudget, timeTillNextExecution);
    }

    // If there's no budget, then don't do anything!
    if (nextBudget === 0)
      return;

    this._virtualTimeStarted  = true;
    this._shouldSendStartNotification  = true;

    if (this._resumeDeferrer)
      this._resumeDeferrer(this._setVirtualTimePolicy.bind(this, nextBudget, waitForNavigation));
    else
      this._setVirtualTimePolicy(nextBudget, waitForNavigation);
  }

  _notifyTasksAndAdvance() {
    // The task may call its continue callback synchronously. Prevent re-entrance.
    if (this._inNotifyTasksAndAdvance)
      return;
    this._inNotifyTasksAndAdvance = true;

    for (let i = 0; i < this._repeatingTasks.length;) {
      const repeatingTask = this._repeatingTasks[i];
      if (repeatingTask.nextExecutionTime <= this._totalElapsedTimeOffset) {
        repeatingTask.readyToAdvance = false;
        repeatingTask.nextExecutionTime = this._totalElapsedTimeOffset + repeatingTask.interval;

        // This may delete itself.
        repeatingTask.task.intervalElapsed(this._totalElapsedTimeOffset, this._taskReadyToAdvance.bind(this, repeatingTask));
      }
      if (i < this._repeatingTasks.length && repeatingTask === this._repeatingTasks[i])
        i++;
    }

    // Give at most as much virtual time as available until the next callback.
    let advanceVirtualTime = false;
    let stopVirtualTime = false;
    let readyToAdvance = true;
    let nextBudget = 0;
    for (let i = 0; i < this._repeatingTasks.length; i++) {
      const repeatingTask = this._repeatingTasks[i];
      if (!repeatingTask.readyToAdvance)
        readyToAdvance = false;
      const timeTillNextExecution = repeatingTask.nextExecutionTime - this._totalElapsedTimeOffset;
      if (nextBudget === 0)
        nextBudget = timeTillNextExecution;
      else
        nextBudget = Math.min(nextBudget, timeTillNextExecution);
      if (repeatingTask.continuePolicy === VirtualTimeContinuePolicy.CONTINUE_MORE_TIME_NEEDED)
        advanceVirtualTime = true;
      else if (repeatingTask.continuePolicy === VirtualTimeContinuePolicy.STOP)
        stopVirtualTime = true;
    }

    if (!readyToAdvance) {
      this._inNotifyTasksAndAdvance = false;
      return;
    }

    if (!advanceVirtualTime || stopVirtualTime) {
      for (let i = 0; i < this._repeatingTasks.length; i++)
        this._repeatingTasks[i].readyToAdvance = false;

      const totalElapsedTimeOffset = this._totalElapsedTimeOffset;
      this._observers.forEach(observer => observer.virtualTimeStopped(totalElapsedTimeOffset));
      this._virtualTimeStarted = false;
      this._inNotifyTasksAndAdvance = false;
      return;
    }

    if (this._resumeDeferrer)
      this._resumeDeferrer(this._setVirtualTimePolicy.bind(this, nextBudget, false /* wait_for_navigation */));
    else
      this._setVirtualTimePolicy(nextBudget, false /* wait_for_navigation */);
    this._inNotifyTasksAndAdvance = false;
  }

  /**
   * @param {!VirtualTimeTaskInfo} taskInfo
   * @param {!string} continuePolicy
   */
  _taskReadyToAdvance(taskInfo, continuePolicy) {
    taskInfo.readyToAdvance = true;
    taskInfo.continuePolicy = continuePolicy;
    this._notifyTasksAndAdvance();
  }

  /**
   * @param {number} budget
   * @param {boolean} waitForNavigation
   */
  _setVirtualTimePolicy(budget, waitForNavigation) {
    this._lastBudget = budget;
    const controller = this;
    this._client.send('Emulation.setVirtualTimePolicy', {policy: 'pauseIfNetworkFetchesPending', budget, waitForNavigation})
        .then(function(result) {
          const epochAdjustment = 1519203783421.48;
          this._virtualTimeBase = result.virtualTimeBase - epochAdjustment;
          if (this._shouldSendStartNotification) {
            this._shouldSendStartNotification = false;
            const totalElapsedTimeOffset = this._totalElapsedTimeOffset;
            this._observers.forEach(observer => observer.virtualTimeStarted(totalElapsedTimeOffset));
          }
        }.bind(controller));
  }

  /**
   * @param {*} event
   */
  _virtualTimeBudgetExpired(event) {
    this._totalElapsedTimeOffset += this._lastBudget;
    this._virtualTimePaused = true;
    this._notifyTasksAndAdvance();
  }

  /**
   * @param {number} budget The number of virtual milliseconds of virtual time budget to grant.
   * @param {string} startPolicy Whether or not virtual time should start advancing immediately or wait for a navigation.
   * @param {function()=} opt_virtualTimeStartedCallback Callback executed when virtual time has started.
   */
  grantVirtualTimeBudget(budget, startPolicy, opt_virtualTimeStartedCallback) {
    const controller = this;
    return new Promise(function(resolve) {
      return new class extends VirtualTimeRepeatingTask {
        constructor() {
          super();
          this._intervalElapsed = false;

          const repeatingTask = this;
          this._observer = new class extends VirtualTimeObserver {
            /** @param {number} virtualTimeOffset */
            virtualTimeStarted(virtualTimeOffset) {
              if (opt_virtualTimeStartedCallback)
                opt_virtualTimeStartedCallback();
            }

            /** @param {number} virtualTimeOffset */
            virtualTimeStopped(virtualTimeOffset) {
              if (repeatingTask._intervalElapsed) {
                controller.removeObserver(this);
                controller.cancelRepeatingTask(repeatingTask);
                resolve();
              }
            }
          }();

          controller.addObserver(this._observer);
          controller.scheduleRepeatingTask(this, budget, 0, startPolicy);
          controller.startVirtualTime();
        }

        /**
         * @param {number} virtualTimeOffset
         * @param {!function(!string)} continueCallback
         */
        intervalElapsed(virtualTimeOffset, continueCallback) {
          this._intervalElapsed = true;
          continueCallback(VirtualTimeContinuePolicy.STOP);
        }

      }();
    });
  }
}

module.exports = {VirtualTimeController, VirtualTimeContinuePolicy, VirtualTimeStartPolicy, VirtualTimeRepeatingTask, VirtualTimeObserver};
