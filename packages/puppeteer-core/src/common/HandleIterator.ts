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

import {type JSHandle} from '../api/JSHandle.js';
import {DisposableStack, disposeSymbol} from '../util/disposable.js';

import {type AwaitableIterable, type HandleFor} from './types.js';

const DEFAULT_BATCH_SIZE = 20;

/**
 * This will transpose an iterator JSHandle into a fast, Puppeteer-side iterator
 * of JSHandles.
 *
 * @param size - The number of elements to transpose. This should be something
 * reasonable.
 */
async function* fastTransposeIteratorHandle<T>(
  iterator: JSHandle<AwaitableIterator<T>>,
  size: number
) {
  using array = await iterator.evaluateHandle(async (iterator, size) => {
    const results = [];
    while (results.length < size) {
      const result = await iterator.next();
      if (result.done) {
        break;
      }
      results.push(result.value);
    }
    return results;
  }, size);
  const properties = (await array.getProperties()) as Map<string, HandleFor<T>>;
  const handles = properties.values();
  using stack = new DisposableStack();
  stack.defer(() => {
    for (using handle of handles) {
      handle[disposeSymbol]();
    }
  });
  yield* handles;
  return properties.size === 0;
}

/**
 * This will transpose an iterator JSHandle in batches based on the default size
 * of {@link fastTransposeIteratorHandle}.
 */

async function* transposeIteratorHandle<T>(
  iterator: JSHandle<AwaitableIterator<T>>
) {
  let size = DEFAULT_BATCH_SIZE;
  while (!(yield* fastTransposeIteratorHandle(iterator, size))) {
    size <<= 1;
  }
}

type AwaitableIterator<T> = Iterator<T> | AsyncIterator<T>;

/**
 * @internal
 */
export async function* transposeIterableHandle<T>(
  handle: JSHandle<AwaitableIterable<T>>
): AsyncIterableIterator<HandleFor<T>> {
  using generatorHandle = await handle.evaluateHandle(iterable => {
    return (async function* () {
      yield* iterable;
    })();
  });
  yield* transposeIteratorHandle(generatorHandle);
}
