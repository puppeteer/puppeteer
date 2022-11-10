/**
 * Copyright 2017 Google Inc. All rights reserved.
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

export {Protocol} from 'devtools-protocol';
/**
 * @deprecated Use the query handler API defined on {@link Puppeteer}
 */
export * from 'puppeteer-core/internal/common/QueryHandler.js';
export {LaunchOptions} from 'puppeteer-core/internal/node/LaunchOptions.js';

export * from 'puppeteer-core/internal/api/Browser.js';
export * from 'puppeteer-core/internal/api/BrowserContext.js';
export * from 'puppeteer-core/internal/api/Page.js';
export * from 'puppeteer-core/internal/common/Accessibility.js';
export * from 'puppeteer-core/internal/common/AriaQueryHandler.js';
export * from 'puppeteer-core/internal/common/Browser.js';
export * from 'puppeteer-core/internal/common/BrowserConnector.js';
export * from 'puppeteer-core/internal/common/BrowserWebSocketTransport.js';
export * from 'puppeteer-core/internal/common/ChromeTargetManager.js';
export * from 'puppeteer-core/internal/common/Configuration.js';
export * from 'puppeteer-core/internal/common/Connection.js';
export * from 'puppeteer-core/internal/common/ConnectionTransport.js';
export * from 'puppeteer-core/internal/common/ConsoleMessage.js';
export * from 'puppeteer-core/internal/common/Coverage.js';
export * from 'puppeteer-core/internal/common/Debug.js';
export * from 'puppeteer-core/internal/common/Device.js';
export * from 'puppeteer-core/internal/common/Dialog.js';
export * from 'puppeteer-core/internal/common/ElementHandle.js';
export * from 'puppeteer-core/internal/common/EmulationManager.js';
export * from 'puppeteer-core/internal/common/Errors.js';
export * from 'puppeteer-core/internal/common/EventEmitter.js';
export * from 'puppeteer-core/internal/common/ExecutionContext.js';
export * from 'puppeteer-core/internal/common/fetch.js';
export * from 'puppeteer-core/internal/common/FileChooser.js';
export * from 'puppeteer-core/internal/common/FirefoxTargetManager.js';
export * from 'puppeteer-core/internal/common/Frame.js';
export * from 'puppeteer-core/internal/common/FrameManager.js';
export * from 'puppeteer-core/internal/common/FrameTree.js';
export * from 'puppeteer-core/internal/common/HTTPRequest.js';
export * from 'puppeteer-core/internal/common/HTTPResponse.js';
export * from 'puppeteer-core/internal/common/Input.js';
export * from 'puppeteer-core/internal/common/IsolatedWorld.js';
export * from 'puppeteer-core/internal/common/JSHandle.js';
export * from 'puppeteer-core/internal/common/LazyArg.js';
export * from 'puppeteer-core/internal/common/LifecycleWatcher.js';
export * from 'puppeteer-core/internal/common/NetworkEventManager.js';
export * from 'puppeteer-core/internal/common/NetworkManager.js';
export * from 'puppeteer-core/internal/common/NodeWebSocketTransport.js';
export * from 'puppeteer-core/internal/common/Page.js';
export * from 'puppeteer-core/internal/common/PDFOptions.js';
export * from 'puppeteer-core/internal/common/PredefinedNetworkConditions.js';
export * from 'puppeteer-core/internal/common/Product.js';
export * from 'puppeteer-core/internal/common/Puppeteer.js';
export * from 'puppeteer-core/internal/common/PuppeteerViewport.js';
export * from 'puppeteer-core/internal/common/SecurityDetails.js';
export * from 'puppeteer-core/internal/common/Target.js';
export * from 'puppeteer-core/internal/common/TargetManager.js';
export * from 'puppeteer-core/internal/common/TaskQueue.js';
export * from 'puppeteer-core/internal/common/TimeoutSettings.js';
export * from 'puppeteer-core/internal/common/Tracing.js';
export * from 'puppeteer-core/internal/common/types.js';
export * from 'puppeteer-core/internal/common/USKeyboardLayout.js';
export * from 'puppeteer-core/internal/common/util.js';
export * from 'puppeteer-core/internal/common/WaitTask.js';
export * from 'puppeteer-core/internal/common/WebWorker.js';
export * from 'puppeteer-core/internal/environment.js';
export * from 'puppeteer-core/internal/generated/injected.js';
export * from 'puppeteer-core/internal/generated/version.js';
export * from 'puppeteer-core/internal/node/BrowserFetcher.js';
export * from 'puppeteer-core/internal/node/BrowserRunner.js';
export * from 'puppeteer-core/internal/node/ChromeLauncher.js';
export * from 'puppeteer-core/internal/node/FirefoxLauncher.js';
export * from 'puppeteer-core/internal/node/LaunchOptions.js';
export * from 'puppeteer-core/internal/node/PipeTransport.js';
export * from 'puppeteer-core/internal/node/ProductLauncher.js';
export * from 'puppeteer-core/internal/node/PuppeteerNode.js';
export * from 'puppeteer-core/internal/revisions.js';
export * from 'puppeteer-core/internal/util/assert.js';
export * from 'puppeteer-core/internal/util/DebuggableDeferredPromise.js';
export * from 'puppeteer-core/internal/util/DeferredPromise.js';
export * from 'puppeteer-core/internal/util/ErrorLike.js';

import {PuppeteerNode} from 'puppeteer-core/internal/node/PuppeteerNode.js';
import {getConfiguration} from './getConfiguration.js';

const configuration = getConfiguration();

/**
 * @public
 */
const puppeteer = new PuppeteerNode({
  isPuppeteerCore: false,
  configuration,
});

export const {
  connect,
  createBrowserFetcher,
  defaultArgs,
  executablePath,
  launch,
} = puppeteer;

export default puppeteer;
