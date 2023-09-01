/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {ElementHandle} from '../api/ElementHandle.js';
import type {Frame} from '../api/Frame.js';
import type PuppeteerUtil from '../injected/injected.js';
import {isErrorLike} from '../util/ErrorLike.js';
import {interpolateFunction, stringifyFunction} from '../util/Function.js';

import {transposeIterableHandle} from './HandleIterator.js';
import type {WaitForSelectorOptions} from './IsolatedWorld.js';
import {LazyArg} from './LazyArg.js';
import type {Awaitable, AwaitableIterable} from './types.js';

/**
 * @internal
 */
export type QuerySelectorAll = (
  node: Node,
  selector: string,
  PuppeteerUtil: PuppeteerUtil
) => AwaitableIterable<Node>;

/**
 * @internal
 */
export type QuerySelector = (
  node: Node,
  selector: string,
  PuppeteerUtil: PuppeteerUtil
) => Awaitable<Node | null>;

/**
 * @internal
 */
export class QueryHandler {
  // Either one of these may be implemented, but at least one must be.
  static querySelectorAll?: QuerySelectorAll;
  static querySelector?: QuerySelector;

  static get _querySelector(): QuerySelector {
    if (this.querySelector) {
      return this.querySelector;
    }
    if (!this.querySelectorAll) {
      throw new Error('Cannot create default `querySelector`.');
    }

    return (this.querySelector = interpolateFunction(
      async (node, selector, PuppeteerUtil) => {
        const querySelectorAll: QuerySelectorAll =
          PLACEHOLDER('querySelectorAll');
        const results = querySelectorAll(node, selector, PuppeteerUtil);
        for await (const result of results) {
          return result;
        }
        return null;
      },
      {
        querySelectorAll: stringifyFunction(this.querySelectorAll),
      }
    ));
  }

  static get _querySelectorAll(): QuerySelectorAll {
    if (this.querySelectorAll) {
      return this.querySelectorAll;
    }
    if (!this.querySelector) {
      throw new Error('Cannot create default `querySelectorAll`.');
    }

    return (this.querySelectorAll = interpolateFunction(
      async function* (node, selector, PuppeteerUtil) {
        const querySelector: QuerySelector = PLACEHOLDER('querySelector');
        const result = await querySelector(node, selector, PuppeteerUtil);
        if (result) {
          yield result;
        }
      },
      {
        querySelector: stringifyFunction(this.querySelector),
      }
    ));
  }

  /**
   * Queries for multiple nodes given a selector and {@link ElementHandle}.
   *
   * Akin to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll | Document.querySelectorAll()}.
   */
  static async *queryAll(
    element: ElementHandle<Node>,
    selector: string
  ): AwaitableIterable<ElementHandle<Node>> {
    using handle = await element.evaluateHandle(
      this._querySelectorAll,
      selector,
      LazyArg.create(context => {
        return context.puppeteerUtil;
      })
    );
    yield* transposeIterableHandle(handle);
  }

  /**
   * Queries for a single node given a selector and {@link ElementHandle}.
   *
   * Akin to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector}.
   */
  static async queryOne(
    element: ElementHandle<Node>,
    selector: string
  ): Promise<ElementHandle<Node> | null> {
    using result = await element.evaluateHandle(
      this._querySelector,
      selector,
      LazyArg.create(context => {
        return context.puppeteerUtil;
      })
    );
    if (!(result instanceof ElementHandle)) {
      return null;
    }
    return result.move();
  }

  /**
   * Waits until a single node appears for a given selector and
   * {@link ElementHandle}.
   *
   * This will always query the handle in the Puppeteer world and migrate the
   * result to the main world.
   */
  static async waitFor(
    elementOrFrame: ElementHandle<Node> | Frame,
    selector: string,
    options: WaitForSelectorOptions
  ): Promise<ElementHandle<Node> | null> {
    let frame!: Frame;
    using element = await (async () => {
      if (!(elementOrFrame instanceof ElementHandle)) {
        frame = elementOrFrame;
        return;
      }
      frame = elementOrFrame.frame;
      return await frame.isolatedRealm().adoptHandle(elementOrFrame);
    })();

    const {visible = false, hidden = false, timeout, signal} = options;

    try {
      signal?.throwIfAborted();

      using handle = await frame.isolatedRealm().waitForFunction(
        async (PuppeteerUtil, query, selector, root, visible) => {
          const querySelector = PuppeteerUtil.createFunction(
            query
          ) as QuerySelector;
          const node = await querySelector(
            root ?? document,
            selector,
            PuppeteerUtil
          );
          return PuppeteerUtil.checkVisibility(node, visible);
        },
        {
          polling: visible || hidden ? 'raf' : 'mutation',
          root: element,
          timeout,
          signal,
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        stringifyFunction(this._querySelector),
        selector,
        element,
        visible ? true : hidden ? false : undefined
      );

      if (signal?.aborted) {
        throw signal.reason;
      }

      if (!(handle instanceof ElementHandle)) {
        return null;
      }
      return await frame.mainRealm().transferHandle(handle);
    } catch (error) {
      if (!isErrorLike(error)) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw error;
      }
      error.message = `Waiting for selector \`${selector}\` failed: ${error.message}`;
      throw error;
    }
  }
}
