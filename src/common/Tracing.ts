/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import {assert} from './assert.js';
import {
  getReadableAsBuffer,
  getReadableFromProtocolStream,
  isErrorLike,
} from './util.js';
import {CDPSession} from './Connection.js';

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
    let resolve: (value: Buffer | undefined) => void;
    let reject: (err: Error) => void;
    const contentPromise = new Promise<Buffer | undefined>((x, y) => {
      resolve = x;
      reject = y;
    });
    this.#client.once('Tracing.tracingComplete', async event => {
      try {
        const readable = await getReadableFromProtocolStream(
          this.#client,
          event.stream
        );
        const buffer = await getReadableAsBuffer(readable, this.#path);
        resolve(buffer ?? undefined);
      } catch (error) {
        if (isErrorLike(error)) {
          reject(error);
        } else {
          reject(new Error(`Unknown error: ${error}`));
        }
      }
    });
    await this.#client.send('Tracing.end');
    this.#recording = false;
    return contentPromise;
  }
}
