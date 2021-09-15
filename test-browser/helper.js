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

/**
 * Returns the web socket endpoint for the backend of the browser the tests run
 * in. Used to create connections to that browser in Puppeteer for unit tests.
 *
 * It's available on window.__ENV__ because setup code in
 * web-test-runner.config.js puts it there. If you're changing this code (or
 * that code), make sure the other is updated accordingly.
 */
export function getWebSocketEndpoint() {
  return window.__ENV__.wsEndpoint;
}
