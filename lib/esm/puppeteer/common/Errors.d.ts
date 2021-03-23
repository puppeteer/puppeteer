/**
 * Copyright 2018 Google Inc. All rights reserved.
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
declare class CustomError extends Error {
    constructor(message: string);
}
/**
 * TimeoutError is emitted whenever certain operations are terminated due to timeout.
 *
 * @remarks
 *
 * Example operations are {@link Page.waitForSelector | page.waitForSelector}
 * or {@link PuppeteerNode.launch | puppeteer.launch}.
 *
 * @public
 */
export declare class TimeoutError extends CustomError {
}
export declare type PuppeteerErrors = Record<string, typeof CustomError>;
export declare const puppeteerErrors: PuppeteerErrors;
export {};
//# sourceMappingURL=Errors.d.ts.map