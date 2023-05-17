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

/**
 * @deprecated Do not use.
 *
 * @public
 */
export class CustomError extends Error {
  /**
   * @internal
   */
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * TimeoutError is emitted whenever certain operations are terminated due to
 * timeout.
 *
 * @remarks
 * Example operations are {@link Page.waitForSelector | page.waitForSelector} or
 * {@link PuppeteerNode.launch | puppeteer.launch}.
 *
 * @public
 */
export class TimeoutError extends CustomError {}

/**
 * ProtocolError is emitted whenever there is an error from the protocol.
 *
 * @public
 */
export class ProtocolError extends CustomError {
  #code?: number;
  #originalMessage = '';

  set code(code: number | undefined) {
    this.#code = code;
  }
  /**
   * @readonly
   * @public
   */
  get code(): number | undefined {
    return this.#code;
  }

  set originalMessage(originalMessage: string) {
    this.#originalMessage = originalMessage;
  }
  /**
   * @readonly
   * @public
   */
  get originalMessage(): string {
    return this.#originalMessage;
  }
}

/**
 * @internal
 */
export class TargetCloseError extends ProtocolError {}

/**
 * @deprecated Do not use.
 *
 * @public
 */
export interface PuppeteerErrors {
  TimeoutError: typeof TimeoutError;
  ProtocolError: typeof ProtocolError;
}

/**
 * @deprecated Import error classes directly.
 *
 * Puppeteer methods might throw errors if they are unable to fulfill a request.
 * For example, `page.waitForSelector(selector[, options])` might fail if the
 * selector doesn't match any nodes during the given timeframe.
 *
 * For certain types of errors Puppeteer uses specific error classes. These
 * classes are available via `puppeteer.errors`.
 *
 * @example
 * An example of handling a timeout error:
 *
 * ```ts
 * try {
 *   await page.waitForSelector('.foo');
 * } catch (e) {
 *   if (e instanceof TimeoutError) {
 *     // Do something if this is a timeout.
 *   }
 * }
 * ```
 *
 * @public
 */
export const errors: PuppeteerErrors = Object.freeze({
  TimeoutError,
  ProtocolError,
});
