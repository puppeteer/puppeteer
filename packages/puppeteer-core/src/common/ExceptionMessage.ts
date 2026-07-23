/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/protocol/protocol.js';
import type {Protocol} from 'devtools-protocol';

import type {JSHandle} from '../api/JSHandle.js';

import type {ConsoleMessageLocation} from './ConsoleMessage.js';

/**
 * ExceptionMessage objects are dispatched by page via the 'exception' event.
 * @public
 */
export class ExceptionMessage {
  #text: string;
  #stackTraceLocations: ConsoleMessageLocation[];
  #exception?: JSHandle;
  #exceptionId?: number;
  #rawCdpStackTrace?: Protocol.Runtime.StackTrace;
  #rawBidiStackTrace?: Bidi.Script.StackTrace;

  /**
   * @internal
   */
  constructor(
    text: string,
    stackTraceLocations: ConsoleMessageLocation[],
    exception?: JSHandle,
    exceptionId?: number,
    rawCdpStackTrace?: Protocol.Runtime.StackTrace,
    rawBidiStackTrace?: Bidi.Script.StackTrace,
  ) {
    this.#text = text;
    this.#stackTraceLocations = stackTraceLocations;
    this.#exception = exception;
    this.#exceptionId = exceptionId;
    this.#rawCdpStackTrace = rawCdpStackTrace;
    this.#rawBidiStackTrace = rawBidiStackTrace;
  }

  /**
   * The text of the exception message.
   */
  text(): string {
    return this.#text;
  }

  /**
   * The array of locations on the stack of the exception message.
   */
  stackTrace(): ConsoleMessageLocation[] {
    return this.#stackTraceLocations;
  }

  /**
   * The location of the exception message.
   */
  location(): ConsoleMessageLocation {
    return this.#stackTraceLocations[0] ?? {};
  }

  /**
   * The exception object as a JSHandle.
   */
  exception(): JSHandle | undefined {
    return this.#exception;
  }

  /**
   * The exception ID.
   */
  exceptionId(): number | undefined {
    return this.#exceptionId;
  }

  /**
   * The underlying CDP protocol stack trace if available.
   *
   * @internal
   */
  _rawCdpStackTrace(): Protocol.Runtime.StackTrace | undefined {
    return this.#rawCdpStackTrace;
  }

  /**
   * The underlying BiDi protocol stack trace if available.
   *
   * @internal
   */
  _rawBidiStackTrace(): Bidi.Script.StackTrace | undefined {
    return this.#rawBidiStackTrace;
  }
}
