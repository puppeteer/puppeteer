/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { WaitForSelectorOptions, DOMWorld } from './DOMWorld.js';
import { ElementHandle, JSHandle } from './JSHandle.js';
/**
 * @internal
 */
export interface InternalQueryHandler {
    queryOne?: (element: ElementHandle, selector: string) => Promise<ElementHandle | null>;
    waitFor?: (domWorld: DOMWorld, selector: string, options: WaitForSelectorOptions) => Promise<ElementHandle | null>;
    queryAll?: (element: ElementHandle, selector: string) => Promise<ElementHandle[]>;
    queryAllArray?: (element: ElementHandle, selector: string) => Promise<JSHandle>;
}
/**
 * Contains two functions `queryOne` and `queryAll` that can
 * be {@link Puppeteer.registerCustomQueryHandler | registered}
 * as alternative querying strategies. The functions `queryOne` and `queryAll`
 * are executed in the page context.  `queryOne` should take an `Element` and a
 * selector string as argument and return a single `Element` or `null` if no
 * element is found. `queryAll` takes the same arguments but should instead
 * return a `NodeListOf<Element>` or `Array<Element>` with all the elements
 * that match the given query selector.
 * @public
 */
export interface CustomQueryHandler {
    queryOne?: (element: Element | Document, selector: string) => Element | null;
    queryAll?: (element: Element | Document, selector: string) => Element[] | NodeListOf<Element>;
}
/**
 * @internal
 */
export declare function registerCustomQueryHandler(name: string, handler: CustomQueryHandler): void;
/**
 * @internal
 */
export declare function unregisterCustomQueryHandler(name: string): void;
/**
 * @internal
 */
export declare function customQueryHandlerNames(): string[];
/**
 * @internal
 */
export declare function clearCustomQueryHandlers(): void;
/**
 * @internal
 */
export declare function getQueryHandlerAndSelector(selector: string): {
    updatedSelector: string;
    queryHandler: InternalQueryHandler;
};
//# sourceMappingURL=QueryHandler.d.ts.map