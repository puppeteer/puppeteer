"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const initialize_web_js_1 = require("./initialize-web.js");
const environment_js_1 = require("./environment.js");
if (environment_js_1.isNode) {
    throw new Error('Trying to run Puppeteer-Web in a Node environment');
}
exports.default = initialize_web_js_1.initializePuppeteerWeb('puppeteer');
//# sourceMappingURL=web.js.map