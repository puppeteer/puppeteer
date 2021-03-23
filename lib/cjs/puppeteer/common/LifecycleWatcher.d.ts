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
/// <reference types="node" />
import { PuppeteerEventListener } from './helper.js';
import { TimeoutError } from './Errors.js';
import { FrameManager, Frame } from './FrameManager.js';
import { HTTPRequest } from './HTTPRequest.js';
import { HTTPResponse } from './HTTPResponse.js';
export declare type PuppeteerLifeCycleEvent = 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
declare type ProtocolLifeCycleEvent = 'load' | 'DOMContentLoaded' | 'networkIdle' | 'networkAlmostIdle';
/**
 * @internal
 */
export declare class LifecycleWatcher {
    _expectedLifecycle: ProtocolLifeCycleEvent[];
    _frameManager: FrameManager;
    _frame: Frame;
    _timeout: number;
    _navigationRequest?: HTTPRequest;
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
    constructor(frameManager: FrameManager, frame: Frame, waitUntil: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[], timeout: number);
    _onRequest(request: HTTPRequest): void;
    _onFrameDetached(frame: Frame): void;
    navigationResponse(): HTTPResponse | null;
    _terminate(error: Error): void;
    sameDocumentNavigationPromise(): Promise<Error | null>;
    newDocumentNavigationPromise(): Promise<Error | null>;
    lifecyclePromise(): Promise<void>;
    timeoutOrTerminationPromise(): Promise<Error | TimeoutError | null>;
    _createTimeoutPromise(): Promise<TimeoutError | null>;
    _navigatedWithinDocument(frame: Frame): void;
    _checkLifecycleComplete(): void;
    dispose(): void;
}
export {};
//# sourceMappingURL=LifecycleWatcher.d.ts.map