/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import {helper, assert, PuppeteerEventListener} from './helper';
import {Events} from './Events';
import {TimeoutError} from './Errors';

export type PuppeteerLifeCycleEvent = 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
type ProtocolLifeCycleEvent = 'load' | 'DOMContentLoaded' | 'networkIdle' | 'networkAlmostIdle';

const puppeteerToProtocolLifecycle = new Map<PuppeteerLifeCycleEvent, ProtocolLifeCycleEvent>([
  ['load', 'load'],
  ['domcontentloaded', 'DOMContentLoaded'],
  ['networkidle0', 'networkIdle'],
  ['networkidle2', 'networkAlmostIdle'],
]);


export class LifecycleWatcher {
  _expectedLifecycle: ProtocolLifeCycleEvent[];
  _frameManager: Puppeteer.FrameManager;
  _frame: Puppeteer.Frame;
  _timeout: number;
  _navigationRequest?: Puppeteer.Request;
  _eventListeners: PuppeteerEventListener[];
  _initialLoaderId: string;


  _sameDocumentNavigationPromise: Promise<Error | null>;
  _sameDocumentNavigationCompleteCallback: (x?: Error) => void;

  _lifecyclePromise: Promise<void>;
  _lifecycleCallback: () => void;

  _newDocumentNavigationPromise: Promise<Error | null>;
  _newDocumentNavigationCompleteCallback: (x?: Error) => void;

  _terminationPromise: Promise<Error | null>;
  _terminationCallback: (x?: Error) => void;

  _timeoutPromise: Promise<TimeoutError | null>;

  _maximumTimer?: NodeJS.Timeout;
  _hasSameDocumentNavigation?: boolean;

  constructor(frameManager: Puppeteer.FrameManager, frame: Puppeteer.Frame, waitUntil: PuppeteerLifeCycleEvent|PuppeteerLifeCycleEvent[], timeout: number) {
    if (Array.isArray(waitUntil))
      waitUntil = waitUntil.slice();
    else if (typeof waitUntil === 'string')
      waitUntil = [waitUntil];
    this._expectedLifecycle = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle.get(value);
      assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent;
    });

    this._frameManager = frameManager;
    this._frame = frame;
    this._initialLoaderId = frame._loaderId;
    this._timeout = timeout;
    /** @type {?Puppeteer.Request} */
    this._navigationRequest = null;
    this._eventListeners = [
      helper.addEventListener(frameManager._client, Events.CDPSession.Disconnected, () => this._terminate(new Error('Navigation failed because browser has disconnected!'))),
      helper.addEventListener(this._frameManager, Events.FrameManager.LifecycleEvent, this._checkLifecycleComplete.bind(this)),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameNavigatedWithinDocument, this._navigatedWithinDocument.bind(this)),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameDetached, this._onFrameDetached.bind(this)),
      helper.addEventListener(this._frameManager.networkManager(), Events.NetworkManager.Request, this._onRequest.bind(this)),
    ];

    this._sameDocumentNavigationPromise = new Promise<Error | null>(fulfill => {
      this._sameDocumentNavigationCompleteCallback = fulfill;
    });

    this._lifecyclePromise = new Promise(fulfill => {
      this._lifecycleCallback = fulfill;
    });

    this._newDocumentNavigationPromise = new Promise(fulfill => {
      this._newDocumentNavigationCompleteCallback = fulfill;
    });

    this._timeoutPromise = this._createTimeoutPromise();
    this._terminationPromise = new Promise(fulfill => {
      this._terminationCallback = fulfill;
    });
    this._checkLifecycleComplete();
  }

  _onRequest(request: Puppeteer.Request): void {
    if (request.frame() !== this._frame || !request.isNavigationRequest())
      return;
    this._navigationRequest = request;
  }

  _onFrameDetached(frame: Puppeteer.Frame): void {
    if (this._frame === frame) {
      this._terminationCallback.call(null, new Error('Navigating frame was detached'));
      return;
    }
    this._checkLifecycleComplete();
  }

  navigationResponse(): Puppeteer.Response | null {
    return this._navigationRequest ? this._navigationRequest.response() : null;
  }

  _terminate(error: Error): void {
    this._terminationCallback.call(null, error);
  }

  sameDocumentNavigationPromise(): Promise<Error | null> {
    return this._sameDocumentNavigationPromise;
  }

  newDocumentNavigationPromise(): Promise<Error | null> {
    return this._newDocumentNavigationPromise;
  }

  lifecyclePromise(): Promise<void> {
    return this._lifecyclePromise;
  }

  timeoutOrTerminationPromise(): Promise<Error | TimeoutError | null> {
    return Promise.race([this._timeoutPromise, this._terminationPromise]);
  }

  _createTimeoutPromise(): Promise<TimeoutError | null> {
    if (!this._timeout)
      return new Promise(() => {});
    const errorMessage = 'Navigation timeout of ' + this._timeout + ' ms exceeded';
    return new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
        .then(() => new TimeoutError(errorMessage));
  }

  _navigatedWithinDocument(frame: Puppeteer.Frame): void {
    if (frame !== this._frame)
      return;
    this._hasSameDocumentNavigation = true;
    this._checkLifecycleComplete();
  }

  _checkLifecycleComplete(): void {
    // We expect navigation to commit.
    if (!checkLifecycle(this._frame, this._expectedLifecycle))
      return;
    this._lifecycleCallback();
    if (this._frame._loaderId === this._initialLoaderId && !this._hasSameDocumentNavigation)
      return;
    if (this._hasSameDocumentNavigation)
      this._sameDocumentNavigationCompleteCallback();
    if (this._frame._loaderId !== this._initialLoaderId)
      this._newDocumentNavigationCompleteCallback();

    /**
     * @param {!Puppeteer.Frame} frame
     * @param {!Array<string>} expectedLifecycle
     * @return {boolean}
     */
    function checkLifecycle(frame: Puppeteer.Frame, expectedLifecycle: ProtocolLifeCycleEvent[]): boolean {
      for (const event of expectedLifecycle) {
        if (!frame._lifecycleEvents.has(event))
          return false;
      }
      for (const child of frame.childFrames()) {
        if (!checkLifecycle(child, expectedLifecycle))
          return false;
      }
      return true;
    }
  }

  dispose(): void {
    helper.removeEventListeners(this._eventListeners);
    clearTimeout(this._maximumTimer);
  }
}
