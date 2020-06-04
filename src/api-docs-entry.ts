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
 * This file re-exports any APIs that we want to have documentation generated for.
 * It is used by API Extractor to determine what parts of the system to document.
 *
 * We also have src/api.ts. This is used in `index.js` and by the legacy DocLint system.
 * src/api-docs-entry.ts is ONLY used by API Extractor.
 *
 * Once we have migrated to API Extractor and removed DocLint we can remove the duplication and use this file.
 */
export * from './Accessibility';
export * from './Browser';
export * from './BrowserFetcher';
export * from './Connection';
export * from './ConsoleMessage';
export * from './Coverage';
export * from './Dialog';
export * from './JSHandle';
export * from './ExecutionContext';
export * from './FileChooser';
export * from './FrameManager';
export * from './JSHandle';
export * from './Input';
export * from './Page';
export * from './Puppeteer';
export * from './HTTPRequest';
export * from './HTTPResponse';
export * from './SecurityDetails';
export * from './Target';
export * from './Errors';
export * from './Tracing';
export * from './WebWorker';
