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
// @ts-nocheck

/* This file is used in two places:
 * 1) the coverage-utils use it to gain a list of all methods we check for test
 *    coverage on
 * 2) index.js uses it to iterate through all methods and call
 *    helper.installAsyncStackHooks on
 */
module.exports = {
  Accessibility: require('./common/Accessibility').Accessibility,
  Browser: require('./common/Browser').Browser,
  BrowserContext: require('./common/Browser').BrowserContext,
  BrowserFetcher: require('./node/BrowserFetcher').BrowserFetcher,
  CDPSession: require('./common/Connection').CDPSession,
  ConsoleMessage: require('./common/ConsoleMessage').ConsoleMessage,
  Coverage: require('./common/Coverage').Coverage,
  Dialog: require('./common/Dialog').Dialog,
  ElementHandle: require('./common/JSHandle').ElementHandle,
  ExecutionContext: require('./common/ExecutionContext').ExecutionContext,
  EventEmitter: require('./common/EventEmitter').EventEmitter,
  FileChooser: require('./common/FileChooser').FileChooser,
  Frame: require('./common/FrameManager').Frame,
  JSHandle: require('./common/JSHandle').JSHandle,
  Keyboard: require('./common/Input').Keyboard,
  Mouse: require('./common/Input').Mouse,
  Page: require('./common/Page').Page,
  Puppeteer: require('./common/Puppeteer').Puppeteer,
  HTTPRequest: require('./common/HTTPRequest').HTTPRequest,
  HTTPResponse: require('./common/HTTPResponse').HTTPResponse,
  SecurityDetails: require('./common/SecurityDetails').SecurityDetails,
  Target: require('./common/Target').Target,
  TimeoutError: require('./common/Errors').TimeoutError,
  Touchscreen: require('./common/Input').Touchscreen,
  Tracing: require('./common/Tracing').Tracing,
  WebWorker: require('./common/WebWorker').WebWorker,
};
