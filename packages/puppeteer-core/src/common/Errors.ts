/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
  }

  /**
   * @internal
   */
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
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
 * Puppeteer will throw this error if a method is not
 * supported by the currently used protocol
 *
 * @public
 */
export class UnsupportedOperation extends CustomError {}

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
