/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The base class for all Puppeteer-specific errors
 *
 * @public
 */
export class PuppeteerError extends Error {
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
export class TimeoutError extends PuppeteerError {}

/**
 * ProtocolError is emitted whenever there is an error from the protocol.
 *
 * @public
 */
export class ProtocolError extends PuppeteerError {
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
export class UnsupportedOperation extends PuppeteerError {}

/**
 * @internal
 */
export class TargetCloseError extends ProtocolError {}
