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
import {IterableUtil} from './IterableUtil.js';
import {PQueryEngine} from './PQueryEngine.js';
import {QueryHandler} from './QueryHandler.js';
import {AwaitableIterable} from './types.js';

/**
 * @internal
 */
export class PQueryHandler extends QueryHandler {
  static override async *queryAll(
    element: ElementHandle<Node>,
    selector: string
  ): AwaitableIterable<ElementHandle<Node>> {
    const query = new PQueryEngine(element, selector);
    await query.run();
    const world = element.executionContext()._world!;
    yield* IterableUtil.map(query.elements, element => {
      return world.transferHandle(element);
    });
  }

  static override async queryOne(
    element: ElementHandle<Node>,
    selector: string
  ): Promise<ElementHandle<Node> | null> {
    return (await IterableUtil.first(this.queryAll(element, selector))) ?? null;
  }
}
