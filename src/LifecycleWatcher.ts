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

import { helper, assert } from './helper';
import { Events } from './Events';
import { TimeoutError } from './Errors';
import { FrameManager, Frame } from './FrameManager';
import { Request, Response } from './NetworkManager';
import { AnyFunction } from './types';

export class LifecycleWatcher {
  private _frameManager: FrameManager;
  private _frame: Frame;
  private _initialLoaderId: string;
  private _timeout: number;
  private _expectedLifecycle: string[];
  private _navigationRequest: Request | null = null;
  private _eventListeners: Array<{
    emitter: NodeJS.EventEmitter;
    eventName: string | symbol;
    handler: AnyFunction;
  }> = [];
  private _sameDocumentNavigationPromise: Promise<Error | null>;
  private _sameDocumentNavigationCompleteCallback!: () => void;
  private _lifecyclePromise: Promise<void>;
  private _lifecycleCallback!: () => void;
  private _newDocumentNavigationPromise: Promise<Error | null>;
  private _newDocumentNavigationCompleteCallback!: () => void;
  private _terminationPromise: Promise<Error | null>;
  private _terminationCallback!: (e: Error | null) => void;
  private _timeoutPromise: Promise<Error | null>;
  private _hasSameDocumentNavigation?: boolean;
  private _maximumTimer!: ReturnType<typeof setTimeout>;

  constructor(frameManager: FrameManager, frame: Frame, waitUntil: string | string[], timeout: number) {
    if (Array.isArray(waitUntil)) waitUntil = waitUntil.slice();
    else if (typeof waitUntil === 'string') waitUntil = [waitUntil];
    this._expectedLifecycle = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle.get(value);
      assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent;
    });

    this._frameManager = frameManager;
    this._frame = frame;
    this._initialLoaderId = frame._loaderId;
    this._timeout = timeout;
    this._eventListeners = [
      helper.addEventListener(frameManager._client, Events.CDPSession.Disconnected, () =>
        this._terminate(new Error('Navigation failed because browser has disconnected!'))
      ),
      helper.addEventListener(
        this._frameManager,
        Events.FrameManager.LifecycleEvent,
        this._checkLifecycleComplete.bind(this)
      ),
      helper.addEventListener(
        this._frameManager,
        Events.FrameManager.FrameNavigatedWithinDocument,
        this._navigatedWithinDocument.bind(this)
      ),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameDetached, this._onFrameDetached.bind(this)),
      helper.addEventListener(
        this._frameManager.networkManager(),
        Events.NetworkManager.Request,
        this._onRequest.bind(this)
      )
    ];

    this._sameDocumentNavigationPromise = new Promise(fulfill => {
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

  _onRequest(request: Request) {
    if (request.frame() !== this._frame || !request.isNavigationRequest()) return;
    this._navigationRequest = request;
  }

  private _onFrameDetached(frame: Frame) {
    if (this._frame === frame) {
      this._terminationCallback.call(null, new Error('Navigating frame was detached'));
      return;
    }
    this._checkLifecycleComplete();
  }

  navigationResponse(): Response | null {
    return this._navigationRequest ? this._navigationRequest.response() : null;
  }

  _terminate(error: Error) {
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

  timeoutOrTerminationPromise(): Promise<Error | null> {
    return Promise.race([this._timeoutPromise, this._terminationPromise]);
  }

  _createTimeoutPromise(): Promise<Error | null> {
    if (!this._timeout) return Promise.resolve(null);
    const errorMessage = 'Navigation timeout of ' + this._timeout + ' ms exceeded';
    return new Promise(fulfill => (this._maximumTimer = setTimeout(fulfill, this._timeout))).then(
      () => new TimeoutError(errorMessage)
    );
  }

  _navigatedWithinDocument(frame: Frame) {
    if (frame !== this._frame) return;
    this._hasSameDocumentNavigation = true;
    this._checkLifecycleComplete();
  }

  _checkLifecycleComplete() {
    // We expect navigation to commit.
    if (!checkLifecycle(this._frame, this._expectedLifecycle)) return;
    this._lifecycleCallback();
    if (this._frame._loaderId === this._initialLoaderId && !this._hasSameDocumentNavigation) return;
    if (this._hasSameDocumentNavigation) this._sameDocumentNavigationCompleteCallback();
    if (this._frame._loaderId !== this._initialLoaderId) this._newDocumentNavigationCompleteCallback();

    function checkLifecycle(frame: Frame, expectedLifecycle: string[]): boolean {
      for (const event of expectedLifecycle) {
        if (!frame._lifecycleEvents.has(event)) return false;
      }
      for (const child of frame.childFrames()) {
        if (!checkLifecycle(child, expectedLifecycle)) return false;
      }
      return true;
    }
  }

  dispose() {
    helper.removeEventListeners(this._eventListeners);
    clearTimeout(this._maximumTimer);
  }
}

const puppeteerToProtocolLifecycle = new Map([
  ['load', 'load'],
  ['domcontentloaded', 'DOMContentLoaded'],
  ['networkidle0', 'networkIdle'],
  ['networkidle2', 'networkAlmostIdle']
]);
