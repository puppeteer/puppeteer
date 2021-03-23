"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleWatcher = void 0;
const assert_js_1 = require("./assert.js");
const helper_js_1 = require("./helper.js");
const Errors_js_1 = require("./Errors.js");
const FrameManager_js_1 = require("./FrameManager.js");
const NetworkManager_js_1 = require("./NetworkManager.js");
const Connection_js_1 = require("./Connection.js");
const puppeteerToProtocolLifecycle = new Map([
    ['load', 'load'],
    ['domcontentloaded', 'DOMContentLoaded'],
    ['networkidle0', 'networkIdle'],
    ['networkidle2', 'networkAlmostIdle'],
]);
/**
 * @internal
 */
class LifecycleWatcher {
    constructor(frameManager, frame, waitUntil, timeout) {
        if (Array.isArray(waitUntil))
            waitUntil = waitUntil.slice();
        else if (typeof waitUntil === 'string')
            waitUntil = [waitUntil];
        this._expectedLifecycle = waitUntil.map((value) => {
            const protocolEvent = puppeteerToProtocolLifecycle.get(value);
            assert_js_1.assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
            return protocolEvent;
        });
        this._frameManager = frameManager;
        this._frame = frame;
        this._initialLoaderId = frame._loaderId;
        this._timeout = timeout;
        this._navigationRequest = null;
        this._eventListeners = [
            helper_js_1.helper.addEventListener(frameManager._client, Connection_js_1.CDPSessionEmittedEvents.Disconnected, () => this._terminate(new Error('Navigation failed because browser has disconnected!'))),
            helper_js_1.helper.addEventListener(this._frameManager, FrameManager_js_1.FrameManagerEmittedEvents.LifecycleEvent, this._checkLifecycleComplete.bind(this)),
            helper_js_1.helper.addEventListener(this._frameManager, FrameManager_js_1.FrameManagerEmittedEvents.FrameNavigatedWithinDocument, this._navigatedWithinDocument.bind(this)),
            helper_js_1.helper.addEventListener(this._frameManager, FrameManager_js_1.FrameManagerEmittedEvents.FrameDetached, this._onFrameDetached.bind(this)),
            helper_js_1.helper.addEventListener(this._frameManager.networkManager(), NetworkManager_js_1.NetworkManagerEmittedEvents.Request, this._onRequest.bind(this)),
        ];
        this._sameDocumentNavigationPromise = new Promise((fulfill) => {
            this._sameDocumentNavigationCompleteCallback = fulfill;
        });
        this._lifecyclePromise = new Promise((fulfill) => {
            this._lifecycleCallback = fulfill;
        });
        this._newDocumentNavigationPromise = new Promise((fulfill) => {
            this._newDocumentNavigationCompleteCallback = fulfill;
        });
        this._timeoutPromise = this._createTimeoutPromise();
        this._terminationPromise = new Promise((fulfill) => {
            this._terminationCallback = fulfill;
        });
        this._checkLifecycleComplete();
    }
    _onRequest(request) {
        if (request.frame() !== this._frame || !request.isNavigationRequest())
            return;
        this._navigationRequest = request;
    }
    _onFrameDetached(frame) {
        if (this._frame === frame) {
            this._terminationCallback.call(null, new Error('Navigating frame was detached'));
            return;
        }
        this._checkLifecycleComplete();
    }
    navigationResponse() {
        return this._navigationRequest ? this._navigationRequest.response() : null;
    }
    _terminate(error) {
        this._terminationCallback.call(null, error);
    }
    sameDocumentNavigationPromise() {
        return this._sameDocumentNavigationPromise;
    }
    newDocumentNavigationPromise() {
        return this._newDocumentNavigationPromise;
    }
    lifecyclePromise() {
        return this._lifecyclePromise;
    }
    timeoutOrTerminationPromise() {
        return Promise.race([this._timeoutPromise, this._terminationPromise]);
    }
    _createTimeoutPromise() {
        if (!this._timeout)
            return new Promise(() => { });
        const errorMessage = 'Navigation timeout of ' + this._timeout + ' ms exceeded';
        return new Promise((fulfill) => (this._maximumTimer = setTimeout(fulfill, this._timeout))).then(() => new Errors_js_1.TimeoutError(errorMessage));
    }
    _navigatedWithinDocument(frame) {
        if (frame !== this._frame)
            return;
        this._hasSameDocumentNavigation = true;
        this._checkLifecycleComplete();
    }
    _checkLifecycleComplete() {
        // We expect navigation to commit.
        if (!checkLifecycle(this._frame, this._expectedLifecycle))
            return;
        this._lifecycleCallback();
        if (this._frame._loaderId === this._initialLoaderId &&
            !this._hasSameDocumentNavigation)
            return;
        if (this._hasSameDocumentNavigation)
            this._sameDocumentNavigationCompleteCallback();
        if (this._frame._loaderId !== this._initialLoaderId)
            this._newDocumentNavigationCompleteCallback();
        /**
         * @param {!Frame} frame
         * @param {!Array<string>} expectedLifecycle
         * @returns {boolean}
         */
        function checkLifecycle(frame, expectedLifecycle) {
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
    dispose() {
        helper_js_1.helper.removeEventListeners(this._eventListeners);
        clearTimeout(this._maximumTimer);
    }
}
exports.LifecycleWatcher = LifecycleWatcher;
//# sourceMappingURL=LifecycleWatcher.js.map