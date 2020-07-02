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
export * from './common/Accessibility';
export * from './common/Browser';
export * from './node/BrowserFetcher';
export * from './common/Connection';
export * from './common/ConsoleMessage';
export * from './common/Coverage';
export * from './common/DeviceDescriptors';
export * from './common/Dialog';
export * from './common/JSHandle';
export * from './common/ExecutionContext';
export * from './common/EventEmitter';
export * from './common/FileChooser';
export * from './common/FrameManager';
export * from './common/Input';
export * from './common/Page';
export * from './common/Puppeteer';
export * from './node/LaunchOptions';
export * from './node/Launcher';
export * from './common/HTTPRequest';
export * from './common/HTTPResponse';
export * from './common/SecurityDetails';
export * from './common/Target';
export * from './common/Errors';
export * from './common/Tracing';
export * from './common/WebWorker';
export * from './common/USKeyboardLayout';
export * from './common/EvalTypes';
