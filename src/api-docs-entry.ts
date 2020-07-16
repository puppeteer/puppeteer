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

/*
 * This file re-exports any APIs that we want to have documentation generated
 * for. It is used by API Extractor to determine what parts of the system to
 * document.
 *
 * We also have src/api.ts. This is used in `index.js` and by the legacy DocLint
 * system. src/api-docs-entry.ts is ONLY used by API Extractor.
 *
 * Once we have migrated to API Extractor and removed DocLint we can remove the
 * duplication and use this file.
 */
export * from './common/Accessibility.js';
export * from './common/Browser.js';
export * from './node/BrowserFetcher.js';
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
export * from './common/Input.js';
export * from './common/Page.js';
export * from './common/Puppeteer.js';
export * from './node/LaunchOptions.js';
export * from './node/Launcher.js';
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
export * from 'devtools-protocol/types/protocol';
