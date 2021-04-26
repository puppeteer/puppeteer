/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import {
  LaunchOptions,
  BrowserLaunchArgumentOptions,
} from './node/LaunchOptions.js';
import { BrowserConnectOptions } from './common/BrowserConnector.js';
import { Product } from './common/Product.js';
import { Browser } from './common/Browser.js';
import { ConnectOptions } from './common/Puppeteer.js';
import { DevicesMap } from './common/DeviceDescriptors.js';
import { PuppeteerErrors } from './common/Errors.js';
import { PredefinedNetworkConditions } from './common/NetworkConditions.js';
import { CustomQueryHandler } from './common/QueryHandler.js';

/*
 * This file re-exports any APIs that we want to have documentation generated
 * for. It is used by API Extractor to determine what parts of the system to
 * document.
 *
 * The legacy DocLint system and the unit test coverage system use the list of
 * modules defined in coverage-utils.js. src/api-docs-entry.ts is ONLY used by
 * API Extractor.
 *
 * Once we have migrated to API Extractor and removed DocLint we can remove the
 * duplication and use this file.
 */
export * from './common/Accessibility.js';
export * from './common/Browser.js';
export * from './node/BrowserFetcher.js';
export * from './node/Puppeteer.js';
export * from './common/Coverage.js';
export * from './common/Connection.js';
export * from './common/ConsoleMessage.js';
export * from './common/Coverage.js';
export * from './common/DeviceDescriptors.js';
export * from './common/Dialog.js';
export * from './common/DOMWorld.js';
export * from './common/JSHandle.js';
export * from './common/ExecutionContext.js';
export * from './common/EventEmitter.js';
export * from './common/FileChooser.js';
export * from './common/FrameManager.js';
export * from './common/PuppeteerViewport.js';
export * from './common/Input.js';
export * from './common/Page.js';
export * from './common/Product.js';
export * from './common/Puppeteer.js';
export * from './common/BrowserConnector.js';
export * from './node/Launcher.js';
export * from './node/LaunchOptions.js';
export * from './common/HTTPRequest.js';
export * from './common/HTTPResponse.js';
export * from './common/SecurityDetails.js';
export * from './common/Target.js';
export * from './common/Errors.js';
export * from './common/Tracing.js';
export * from './common/NetworkManager.js';
export * from './common/WebWorker.js';
export * from './common/USKeyboardLayout.js';
export * from './common/EvalTypes.js';
export * from './common/PDFOptions.js';
export * from './common/TimeoutSettings.js';
export * from './common/LifecycleWatcher.js';
export * from './common/QueryHandler.js';
export * from './common/NetworkConditions.js';
export * from 'devtools-protocol/types/protocol';

/*
 * We maintain a namespace that emulates the API of the Puppeteer instance you
 * get when you `import puppeteer from 'puppeteer'.
 *
 * We do this as a namespace because export = PuppeteerDefault where
 * PuppeteerDefault is a namespace seems to make sure that the types work in
 * both ESM and CJS contexts.
 *
 * This namespace must be kept in sync with the public API offered by the
 * PuppeteerNode class.
 */

/**
 * @public
 * {@inheritDoc PuppeteerNode.launch}
 */
export declare function launch(
  options?: LaunchOptions &
    BrowserLaunchArgumentOptions &
    BrowserConnectOptions & {
      product?: Product;
      extraPrefsFirefox?: Record<string, unknown>;
    }
): Promise<Browser>;

/**
 * @public
 * {@inheritDoc PuppeteerNode.connect}
 */
export declare function connect(options: ConnectOptions): Promise<Browser>;

/**
 * @public
 * {@inheritDoc Puppeteer.devices}
 */
export let devices: DevicesMap;
/**
 * @public
 */
export let errors: PuppeteerErrors;
/**
 * @public
 */
export let networkConditions: PredefinedNetworkConditions;

/**
 * @public
 * {@inheritDoc Puppeteer.registerCustomQueryHandler}
 */
export declare function registerCustomQueryHandler(
  name: string,
  queryHandler: CustomQueryHandler
): void;

/**
 * @public
 * {@inheritDoc Puppeteer.unregisterCustomQueryHandler}
 */
export declare function unregisterCustomQueryHandler(name: string): void;
/**
 * @public
 * {@inheritDoc Puppeteer.customQueryHandlerNames}
 */
export declare function customQueryHandlerNames(): string[];
/**
 * @public
 * {@inheritDoc Puppeteer.clearCustomQueryHandlers}
 */
export declare function clearCustomQueryHandlers(): void;
