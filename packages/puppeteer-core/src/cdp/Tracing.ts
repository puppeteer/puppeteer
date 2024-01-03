/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {CDPSession} from '../api/CDPSession.js';
import {
  getReadableAsBuffer,
  getReadableFromProtocolStream,
} from '../common/util.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {isErrorLike} from '../util/ErrorLike.js';

/**
 * @public
 */
export interface TracingOptions {
  path?: string;
  screenshots?: boolean;
  categories?: string[];
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

  /**
   * @internal
   */
  constructor(client: CDPSession) {
    this.#client = client;
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
      'Cannot start recording trace while already recording trace.'
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
    const {path, screenshots = false, categories = defaultCategories} = options;

    if (screenshots) {
      categories.push('disabled-by-default-devtools.screenshot');
    }

    const excludedCategories = categories
      .filter(cat => {
        return cat.startsWith('-');
      })
      .map(cat => {
        return cat.slice(1);
      });
    const includedCategories = categories.filter(cat => {
      return !cat.startsWith('-');
    });

    this.#path = path;
    this.#recording = true;
    await this.#client.send('Tracing.start', {
      transferMode: 'ReturnAsStream',
      traceConfig: {
        excludedCategories,
        includedCategories,
      },
    });
  }

  /**
   * Stops a trace started with the `start` method.
   * @returns Promise which resolves to buffer with trace data.
   */
  async stop(): Promise<Buffer | undefined> {
    const contentDeferred = Deferred.create<Buffer | undefined>();
    this.#client.once('Tracing.tracingComplete', async event => {
      try {
        assert(event.stream, 'Missing "stream"');
        const readable = await getReadableFromProtocolStream(
          this.#client,
          event.stream
        );
        const buffer = await getReadableAsBuffer(readable, this.#path);
        contentDeferred.resolve(buffer ?? undefined);
      } catch (error) {
        if (isErrorLike(error)) {
          contentDeferred.reject(error);
        } else {
          contentDeferred.reject(new Error(`Unknown error: ${error}`));
        }
      }
    });
    await this.#client.send('Tracing.end');
    this.#recording = false;
    return await contentDeferred.valueOrThrow();
  }
}
