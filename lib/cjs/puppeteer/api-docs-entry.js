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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkConditions = exports.errors = exports.devices = void 0;
/*
 * This file re-exports any APIs that we want to have documentation generated
 * for. It is used by API Extractor to determine what parts of the system to
 * document.
 *
 * The legacy DocLint system and the unit test coverage system use the list of
 * modules defined in coverage-utils.js. src/api-docs-entry.ts is ONLY used by
 * API Extractor.
 *
 * Once we have migrated to API Extractor and removed DocLint we can remove the
 * duplication and use this file.
 */
__exportStar(require("./common/Accessibility.js"), exports);
__exportStar(require("./common/Browser.js"), exports);
__exportStar(require("./node/BrowserFetcher.js"), exports);
__exportStar(require("./node/Puppeteer.js"), exports);
__exportStar(require("./common/Coverage.js"), exports);
__exportStar(require("./common/Connection.js"), exports);
__exportStar(require("./common/ConsoleMessage.js"), exports);
__exportStar(require("./common/Coverage.js"), exports);
__exportStar(require("./common/DeviceDescriptors.js"), exports);
__exportStar(require("./common/Dialog.js"), exports);
__exportStar(require("./common/DOMWorld.js"), exports);
__exportStar(require("./common/JSHandle.js"), exports);
__exportStar(require("./common/ExecutionContext.js"), exports);
__exportStar(require("./common/EventEmitter.js"), exports);
__exportStar(require("./common/FileChooser.js"), exports);
__exportStar(require("./common/FrameManager.js"), exports);
__exportStar(require("./common/PuppeteerViewport.js"), exports);
__exportStar(require("./common/Input.js"), exports);
__exportStar(require("./common/Page.js"), exports);
__exportStar(require("./common/Product.js"), exports);
__exportStar(require("./common/Puppeteer.js"), exports);
__exportStar(require("./common/BrowserConnector.js"), exports);
__exportStar(require("./node/Launcher.js"), exports);
__exportStar(require("./node/LaunchOptions.js"), exports);
__exportStar(require("./common/HTTPRequest.js"), exports);
__exportStar(require("./common/HTTPResponse.js"), exports);
__exportStar(require("./common/SecurityDetails.js"), exports);
__exportStar(require("./common/Target.js"), exports);
__exportStar(require("./common/Errors.js"), exports);
__exportStar(require("./common/Tracing.js"), exports);
__exportStar(require("./common/NetworkManager.js"), exports);
__exportStar(require("./common/WebWorker.js"), exports);
__exportStar(require("./common/USKeyboardLayout.js"), exports);
__exportStar(require("./common/EvalTypes.js"), exports);
__exportStar(require("./common/PDFOptions.js"), exports);
__exportStar(require("./common/TimeoutSettings.js"), exports);
__exportStar(require("./common/LifecycleWatcher.js"), exports);
__exportStar(require("./common/QueryHandler.js"), exports);
__exportStar(require("./common/NetworkConditions.js"), exports);
__exportStar(require("devtools-protocol/types/protocol"), exports);
//# sourceMappingURL=api-docs-entry.js.map