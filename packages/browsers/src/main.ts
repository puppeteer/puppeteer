/**
 * Copyright 2023 Google Inc. All rights reserved.
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

export {
  launch,
  computeExecutablePath,
  computeSystemExecutablePath,
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX,
} from './launcher.js';
export {fetch, canFetch} from './fetch.js';
export {detectBrowserPlatform} from './detectPlatform.js';
export {
  Browser,
  BrowserPlatform,
  ChromeReleaseChannel,
} from './browsers/browsers.js';
