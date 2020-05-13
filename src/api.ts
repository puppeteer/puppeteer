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

/* This file is used in two places:
 * 1) the coverage-utils use it to gain a list of all methods we check for test coverage on
 * 2) index.js uses it to iterate through all methods and call helper.installAsyncStackHooks on
 */
module.exports = {
  Accessibility: require('./Accessibility').Accessibility,
  Browser: require('./Browser').Browser,
  BrowserContext: require('./Browser').BrowserContext,
  BrowserFetcher: require('./BrowserFetcher').BrowserFetcher,
  CDPSession: require('./Connection').CDPSession,
  ConsoleMessage: require('./ConsoleMessage').ConsoleMessage,
  Coverage: require('./Coverage').Coverage,
  Dialog: require('./Dialog').Dialog,
  ElementHandle: require('./JSHandle').ElementHandle,
  ExecutionContext: require('./ExecutionContext').ExecutionContext,
  FileChooser: require('./FileChooser').FileChooser,
  Frame: require('./FrameManager').Frame,
  JSHandle: require('./JSHandle').JSHandle,
  Keyboard: require('./Input').Keyboard,
  Mouse: require('./Input').Mouse,
  Page: require('./Page').Page,
  Puppeteer: require('./Puppeteer').Puppeteer,
  Request: require('./Request').Request,
  Response: require('./Response').Response,
  SecurityDetails: require('./SecurityDetails').SecurityDetails,
  Target: require('./Target').Target,
  TimeoutError: require('./Errors').TimeoutError,
  Touchscreen: require('./Input').Touchscreen,
  Tracing: require('./Tracing').Tracing,
  Worker: require('./Worker').Worker,
};
