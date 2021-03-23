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
import { Page } from './Page.js';
import { WebWorker } from './WebWorker.js';
import { CDPSession } from './Connection.js';
import { Browser, BrowserContext } from './Browser.js';
import { Viewport } from './PuppeteerViewport.js';
import { Protocol } from 'devtools-protocol';
/**
 * @public
 */
export declare class Target {
    private _targetInfo;
    private _browserContext;
    private _sessionFactory;
    private _ignoreHTTPSErrors;
    private _defaultViewport?;
    private _pagePromise?;
    private _workerPromise?;
    /**
     * @internal
     */
    _initializedPromise: Promise<boolean>;
    /**
     * @internal
     */
    _initializedCallback: (x: boolean) => void;
    /**
     * @internal
     */
    _isClosedPromise: Promise<void>;
    /**
     * @internal
     */
    _closedCallback: () => void;
    /**
     * @internal
     */
    _isInitialized: boolean;
    /**
     * @internal
     */
    _targetId: string;
    /**
     * @internal
     */
    constructor(targetInfo: Protocol.Target.TargetInfo, browserContext: BrowserContext, sessionFactory: () => Promise<CDPSession>, ignoreHTTPSErrors: boolean, defaultViewport: Viewport | null);
    /**
     * Creates a Chrome Devtools Protocol session attached to the target.
     */
    createCDPSession(): Promise<CDPSession>;
    /**
     * If the target is not of type `"page"` or `"background_page"`, returns `null`.
     */
    page(): Promise<Page | null>;
    /**
     * If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.
     */
    worker(): Promise<WebWorker | null>;
    url(): string;
    /**
     * Identifies what kind of target this is.
     *
     * @remarks
     *
     * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
     */
    type(): 'page' | 'background_page' | 'service_worker' | 'shared_worker' | 'other' | 'browser' | 'webview';
    /**
     * Get the browser the target belongs to.
     */
    browser(): Browser;
    browserContext(): BrowserContext;
    /**
     * Get the target that opened this target. Top-level targets return `null`.
     */
    opener(): Target | null;
    /**
     * @internal
     */
    _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void;
}
//# sourceMappingURL=Target.d.ts.map