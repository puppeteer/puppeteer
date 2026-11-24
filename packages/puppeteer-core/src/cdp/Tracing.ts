/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {type CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import type {Logger} from '../common/Debug.js';
import {TargetCloseError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {
  getReadableAsTypedArray,
  getReadableFromProtocolStream,
} from '../common/util.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {DisposableStack} from '../util/disposable.js';
import {isErrorLike} from '../util/ErrorLike.js';

/**
 * @public
 */
export interface TracingOptions {
  /**
   * The file path to write the trace to.
   * If no path is specified, the trace will not be written to disk, but can
   * still be retrieved as a `Uint8Array` from `tracing.stop()`.
   */
  path?: string;
  /**
   * Whether to capture screenshots in the trace.
   *
   * @defaultValue `false`
   */
  screenshots?: boolean;
  /**
   * The tracing categories to include/exclude.
   *
   * To exclude a category, prefix it with `-` (e.g., `-toplevel`).
   *
   * @defaultValue Default categories listed in the implementation.
   */
  categories?: string[];
  /**
   * Size of the trace buffer in kilobytes.
   * If not specified or zero is passed, the default value of 200 MB
   * (200,000 KB) is used by Chromium.
   */
  bufferSize?: number;
}

/**
 * The Tracing class exposes the tracing audit interface.
 * @remarks
 * You can use `tracing.start` and `tracing.stop` to create a trace file
 * which can be opened in Chrome DevTools or {@link https://chromedevtools.github.io/timeline-viewer/ | timeline viewer}.
 *
 * @example
 *
 * ```ts
 * await page.tracing.start({path: 'trace.json'});
 * await page.goto('https://www.google.com');
 * await page.tracing.stop();
 * ```
 *
 * @public
 */
export class Tracing {
  #client: CDPSession;
  #recording = false;
  #path?: string;
  #logger: Logger;

  /**
   * @internal
   */
  constructor(client: CDPSession, logger: Logger) {
    this.#client = client;
    this.#logger = logger;
  }

  /**
   * @internal
   */
  updateClient(client: CDPSession): void {
    this.#client = client;
  }

  /**
   * Starts a trace for the current page.
   * @remarks
   * Only one trace can be active at a time per browser.
   *
   * @param options - Optional `TracingOptions`.
   */
  async start(options: TracingOptions = {}): Promise<void> {
    assert(
      !this.#recording,
      'Cannot start recording trace while already recording trace.',
    );

    const defaultCategories = [
      '-*',
      'devtools.timeline',
      'v8.execute',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
      'toplevel',
      'blink.console',
      'blink.user_timing',
      'latencyInfo',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profiler',
    ];
    const {
      path,
      screenshots = false,
      categories = defaultCategories,
      bufferSize,
    } = options;

    const effectiveCategories = screenshots
      ? [...categories, 'disabled-by-default-devtools.screenshot']
      : categories;

    const excludedCategories = effectiveCategories
      .filter(cat => {
        return cat.startsWith('-');
      })
      .map(cat => {
        return cat.slice(1);
      });
    const includedCategories = effectiveCategories.filter(cat => {
      return !cat.startsWith('-');
    });

    this.#path = path;
    this.#recording = true;
    try {
      await this.#client.send('Tracing.start', {
        transferMode: 'ReturnAsStream',
        traceConfig: {
          excludedCategories,
          includedCategories,
          traceBufferSizeInKb: bufferSize,
        },
      });
    } catch (error) {
      this.#recording = false;
      this.#path = undefined;
      throw error;
    }
  }

  /**
   * Stops a trace started with the `start` method.
   * @returns Promise which resolves to buffer with trace data.
   */
  async stop(): Promise<Uint8Array | undefined> {
    const contentDeferred = Deferred.create<Uint8Array | undefined>();
    const client = this.#client;
    using stack = new DisposableStack();
    const clientEmitter = stack.use(new EventEmitter(client));
    clientEmitter.once('Tracing.tracingComplete', async event => {
      try {
        assert(event.stream, 'Missing "stream"');
        const readable = await getReadableFromProtocolStream(
          client,
          event.stream,
        );
        const typedArray = await getReadableAsTypedArray(
          readable,
          this.#path,
          this.#logger,
        );
        contentDeferred.resolve(typedArray ?? undefined);
      } catch (error) {
        if (isErrorLike(error)) {
          contentDeferred.reject(error);
        } else {
          contentDeferred.reject(new Error(`Unknown error: ${error}`));
        }
      }
    });
    clientEmitter.once(CDPSessionEvent.Disconnected, () => {
      contentDeferred.reject(
        new TargetCloseError('Tracing failed: Target closed.'),
      );
    });
    try {
      await client.send('Tracing.end');
    } finally {
      this.#recording = false;
    }
    return await contentDeferred.valueOrThrow();
  }
}
