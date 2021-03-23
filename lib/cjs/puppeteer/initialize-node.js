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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePuppeteerNode = void 0;
const Puppeteer_js_1 = require("./node/Puppeteer.js");
const revisions_js_1 = require("./revisions.js");
const pkg_dir_1 = __importDefault(require("pkg-dir"));
const initializePuppeteerNode = (packageName) => {
    const puppeteerRootDirectory = pkg_dir_1.default.sync(__dirname);
    let preferredRevision = revisions_js_1.PUPPETEER_REVISIONS.chromium;
    const isPuppeteerCore = packageName === 'puppeteer-core';
    // puppeteer-core ignores environment variables
    const productName = isPuppeteerCore
        ? undefined
        : process.env.PUPPETEER_PRODUCT ||
            process.env.npm_config_puppeteer_product ||
            process.env.npm_package_config_puppeteer_product;
    if (!isPuppeteerCore && productName === 'firefox')
        preferredRevision = revisions_js_1.PUPPETEER_REVISIONS.firefox;
    return new Puppeteer_js_1.PuppeteerNode({
        projectRoot: puppeteerRootDirectory,
        preferredRevision,
        isPuppeteerCore,
        productName: productName,
    });
};
exports.initializePuppeteerNode = initializePuppeteerNode;
//# sourceMappingURL=initialize-node.js.map