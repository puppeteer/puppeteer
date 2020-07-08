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

/**
 * This map defines all the classes within Puppeteer that we want to ensure have
 * all their methods called during unit tests to assert full coverage.
 *
 * It is also backs the list of classes that have async stack hooks installed in
 * initialize.ts to give nicer errors.
 *
 * We keep this map as Class Name => Module path because the coverage utils need
 * the full module to check for any additional exported event objects (so we
 * ensure all emitted events get run during testing). The asyncStackHooks helper
 * only wants a list of classes, so below this map we also export a Set of
 * classes that we want to install the async hooks helpers into.
 */
export const publicPuppeteerClasses = new Map([
  ['Accessibility', './common/Accessibility'],
  ['Browser', './common/Browser'],
  ['BrowserContext', './common/Browser'],
  ['BrowserFetcher', './node/BrowserFetcher'],
  ['CDPSession', './common/Connection'],
  ['ConsoleMessage', './common/ConsoleMessage'],
  ['Coverage', './common/Coverage'],
  ['Dialog', './common/Dialog'],
  ['ElementHandle', './common/JSHandle'],
  ['ExecutionContext', './common/ExecutionContext'],
  ['EventEmitter', './common/EventEmitter'],
  ['FileChooser', './common/FileChooser'],
  ['Frame', './common/FrameManager'],
  ['JSHandle', './common/JSHandle'],
  ['Keyboard', './common/Input'],
  ['Mouse', './common/Input'],
  ['Page', './common/Page'],
  ['Puppeteer', './common/Puppeteer'],
  ['HTTPRequest', './common/HTTPRequest'],
  ['HTTPResponse', './common/HTTPResponse'],
  ['SecurityDetails', './common/SecurityDetails'],
  ['Target', './common/Target'],
  ['TimeoutError', './common/Errors'],
  ['Touchscreen', './common/Input'],
  ['Tracing', './common/Tracing'],
  ['WebWorker', './common/WebWorker'],
]);

export const classesForAsyncHelpersInstall = new Set();

for (const [moduleName, modulePath] of publicPuppeteerClasses.entries()) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(modulePath);
  const classForAsyncHelpersInstall = module[moduleName];
  classesForAsyncHelpersInstall.add(classForAsyncHelpersInstall);
}
