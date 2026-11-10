/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {JSHandle} from '../api/JSHandle.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {DisposableStack} from '../util/disposable.js';
import {isErrorLike} from '../util/ErrorLike.js';

import type {ExecutionContext} from './ExecutionContext.js';
import {CDP_BINDING_PREFIX} from './utils.js';

/**
 * @internal
 */
export interface BindingOptions {
  /** Whether to dispose node arguments after the binding call finishes. */
  ownsArguments?: boolean;
  /** Whether to dispose a returned handle after forwarding it to the page. */
  ownsResult?: boolean;
}

/**
 * @internal
 */
export class Binding {
  #name: string;
  #fn: (...args: unknown[]) => unknown;
  #initSource: string;
  #logger: Logger;
  #ownsArguments: boolean;
  #ownsResult: boolean;
  constructor(
    name: string,
    fn: (...args: unknown[]) => unknown,
    initSource: string,
    logger: Logger,
    options: BindingOptions = {},
  ) {
    this.#name = name;
    this.#fn = fn;
    this.#initSource = initSource;
    this.#logger = logger;
    this.#ownsArguments = options.ownsArguments ?? false;
    this.#ownsResult = options.ownsResult ?? false;
  }

  get name(): string {
    return this.#name;
  }

  get initSource(): string {
    return this.#initSource;
  }

  /**
   * @param context - Context to run the binding in; the context should have
   * the binding added to it beforehand.
   * @param id - ID of the call. This should come from the CDP
   * `onBindingCalled` response.
   * @param args - Plain arguments from CDP.
   */
  async run(
    context: ExecutionContext,
    id: number,
    args: unknown[],
    isTrivial: boolean,
  ): Promise<void> {
    using stack = new DisposableStack();
    const cdpName = CDP_BINDING_PREFIX + this.#name;
    try {
      if (!isTrivial) {
        // Getting non-trivial arguments.
        using handles = await context.evaluateHandle(
          (name, seq) => {
            // @ts-expect-error Code is evaluated in a different context.
            return globalThis[name].args.get(seq);
          },
          cdpName,
          id,
        );
        const properties = await handles.getProperties();
        for (const [index, handle] of properties) {
          // This is not straight-forward since some arguments can stringify, but
          // aren't plain objects so add subtypes when the use-case arises.
          if (index in args && handle.remoteObject().subtype === 'node') {
            args[+index] = handle;
            // Exposed functions can retain node arguments beyond this call.
            if (!this.#ownsArguments) {
              continue;
            }
          }
          stack.use(handle);
        }
      }

      const result = await this.#fn(...args);
      if (this.#ownsResult && result instanceof JSHandle) {
        stack.use(result);
      }
      await context.evaluate(
        (name, seq, result) => {
          // @ts-expect-error Code is evaluated in a different context.
          const callbacks = globalThis[name].callbacks;
          callbacks.get(seq).resolve(result);
          callbacks.delete(seq);
        },
        cdpName,
        id,
        result,
      );
    } catch (error) {
      if (isErrorLike(error)) {
        await context
          .evaluate(
            (name, seq, message, stack) => {
              const error = new Error(message);
              error.stack = stack;
              // @ts-expect-error Code is evaluated in a different context.
              const callbacks = globalThis[name].callbacks;
              callbacks.get(seq).reject(error);
              callbacks.delete(seq);
            },
            cdpName,
            id,
            error.message,
            error.stack,
          )
          .catch(error => {
            this.#logger?.(DEBUG_PREFIXES.error)?.(error);
          });
      } else {
        await context
          .evaluate(
            (name, seq, error) => {
              // @ts-expect-error Code is evaluated in a different context.
              const callbacks = globalThis[name].callbacks;
              callbacks.get(seq).reject(error);
              callbacks.delete(seq);
            },
            cdpName,
            id,
            error,
          )
          .catch(error => {
            this.#logger?.(DEBUG_PREFIXES.error)?.(error);
          });
      }
    }
  }
}
