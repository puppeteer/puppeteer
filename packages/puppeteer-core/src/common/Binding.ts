import {JSHandle} from '../api/JSHandle.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {ExecutionContext} from './ExecutionContext.js';
import {debugError} from './util.js';

/**
 * @internal
 */
export class Binding {
  #name: string;
  #fn: (...args: unknown[]) => unknown;
  constructor(name: string, fn: (...args: unknown[]) => unknown) {
    this.#name = name;
    this.#fn = fn;
  }

  get name(): string {
    return this.#name;
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
    isTrivial: boolean
  ): Promise<void> {
    const garbage = [];
    try {
      if (!isTrivial) {
        // Getting non-trivial arguments.
        const handles = await context.evaluateHandle(
          (name, seq) => {
            // @ts-expect-error Code is evaluated in a different context.
            return globalThis[name].args.get(seq);
          },
          this.#name,
          id
        );
        try {
          const properties = await handles.getProperties();
          for (const [index, handle] of properties) {
            // This is not straight-forward since some arguments can stringify, but
            // aren't plain objects so add subtypes when the use-case arises.
            if (index in args) {
              switch (handle.remoteObject().subtype) {
                case 'node':
                  args[+index] = handle;
                  break;
                default:
                  garbage.push(handle.dispose());
              }
            } else {
              garbage.push(handle.dispose());
            }
          }
        } finally {
          await handles.dispose();
        }
      }

      await context.evaluate(
        (name, seq, result) => {
          // @ts-expect-error Code is evaluated in a different context.
          const callbacks = globalThis[name].callbacks;
          callbacks.get(seq).resolve(result);
          callbacks.delete(seq);
        },
        this.#name,
        id,
        await this.#fn(...args)
      );

      for (const arg of args) {
        if (arg instanceof JSHandle) {
          garbage.push(arg.dispose());
        }
      }
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
            this.#name,
            id,
            error.message,
            error.stack
          )
          .catch(debugError);
      } else {
        await context
          .evaluate(
            (name, seq, error) => {
              // @ts-expect-error Code is evaluated in a different context.
              const callbacks = globalThis[name].callbacks;
              callbacks.get(seq).reject(error);
              callbacks.delete(seq);
            },
            this.#name,
            id,
            error
          )
          .catch(debugError);
      }
    } finally {
      await Promise.all(garbage);
    }
  }
}
