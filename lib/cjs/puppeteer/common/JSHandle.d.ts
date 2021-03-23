/**
 * Copyright 2019 Google Inc. All rights reserved.
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
/// <reference types="node" />
import { ExecutionContext } from './ExecutionContext.js';
import { Page } from './Page.js';
import { CDPSession } from './Connection.js';
import { KeyInput } from './USKeyboardLayout.js';
import { FrameManager, Frame } from './FrameManager.js';
import { Protocol } from 'devtools-protocol';
import { EvaluateFn, SerializableOrJSHandle, EvaluateFnReturnType, EvaluateHandleFn, WrapElementHandle, UnwrapPromiseLike } from './EvalTypes.js';
export interface BoxModel {
    content: Array<{
        x: number;
        y: number;
    }>;
    padding: Array<{
        x: number;
        y: number;
    }>;
    border: Array<{
        x: number;
        y: number;
    }>;
    margin: Array<{
        x: number;
        y: number;
    }>;
    width: number;
    height: number;
}
/**
 * @public
 */
export interface BoundingBox {
    /**
     * the x coordinate of the element in pixels.
     */
    x: number;
    /**
     * the y coordinate of the element in pixels.
     */
    y: number;
    /**
     * the width of the element in pixels.
     */
    width: number;
    /**
     * the height of the element in pixels.
     */
    height: number;
}
/**
 * @internal
 */
export declare function createJSHandle(context: ExecutionContext, remoteObject: Protocol.Runtime.RemoteObject): JSHandle;
/**
 * Represents an in-page JavaScript object. JSHandles can be created with the
 * {@link Page.evaluateHandle | page.evaluateHandle} method.
 *
 * @example
 * ```js
 * const windowHandle = await page.evaluateHandle(() => window);
 * ```
 *
 * JSHandle prevents the referenced JavaScript object from being garbage-collected
 * unless the handle is {@link JSHandle.dispose | disposed}. JSHandles are auto-
 * disposed when their origin frame gets navigated or the parent context gets destroyed.
 *
 * JSHandle instances can be used as arguments for {@link Page.$eval},
 * {@link Page.evaluate}, and {@link Page.evaluateHandle}.
 *
 * @public
 */
export declare class JSHandle {
    /**
     * @internal
     */
    _context: ExecutionContext;
    /**
     * @internal
     */
    _client: CDPSession;
    /**
     * @internal
     */
    _remoteObject: Protocol.Runtime.RemoteObject;
    /**
     * @internal
     */
    _disposed: boolean;
    /**
     * @internal
     */
    constructor(context: ExecutionContext, client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject);
    /** Returns the execution context the handle belongs to.
     */
    executionContext(): ExecutionContext;
    /**
     * This method passes this handle as the first argument to `pageFunction`.
     * If `pageFunction` returns a Promise, then `handle.evaluate` would wait
     * for the promise to resolve and return its value.
     *
     * @example
     * ```js
     * const tweetHandle = await page.$('.tweet .retweets');
     * expect(await tweetHandle.evaluate(node => node.innerText)).toBe('10');
     * ```
     */
    evaluate<T extends EvaluateFn>(pageFunction: T | string, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    /**
     * This method passes this handle as the first argument to `pageFunction`.
     *
     * @remarks
     *
     * The only difference between `jsHandle.evaluate` and
     * `jsHandle.evaluateHandle` is that `jsHandle.evaluateHandle`
     * returns an in-page object (JSHandle).
     *
     * If the function passed to `jsHandle.evaluateHandle` returns a Promise,
     * then `evaluateHandle.evaluateHandle` waits for the promise to resolve and
     * returns its value.
     *
     * See {@link Page.evaluateHandle} for more details.
     */
    evaluateHandle<HandleType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandleType>;
    /** Fetches a single property from the referenced object.
     */
    getProperty(propertyName: string): Promise<JSHandle | undefined>;
    /**
     * The method returns a map with property names as keys and JSHandle
     * instances for the property values.
     *
     * @example
     * ```js
     * const listHandle = await page.evaluateHandle(() => document.body.children);
     * const properties = await listHandle.getProperties();
     * const children = [];
     * for (const property of properties.values()) {
     *   const element = property.asElement();
     *   if (element)
     *     children.push(element);
     * }
     * children; // holds elementHandles to all children of document.body
     * ```
     */
    getProperties(): Promise<Map<string, JSHandle>>;
    /**
     * Returns a JSON representation of the object.
     *
     * @remarks
     *
     * The JSON is generated by running {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | JSON.stringify}
     * on the object in page and consequent {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | JSON.parse} in puppeteer.
     * **NOTE** The method throws if the referenced object is not stringifiable.
     */
    jsonValue<T = unknown>(): Promise<T>;
    /**
     * Returns either `null` or the object handle itself, if the object handle is
     * an instance of {@link ElementHandle}.
     */
    asElement(): ElementHandle | null;
    /**
     * Stops referencing the element handle, and resolves when the object handle is
     * successfully disposed of.
     */
    dispose(): Promise<void>;
    /**
     * Returns a string representation of the JSHandle.
     *
     * @remarks Useful during debugging.
     */
    toString(): string;
}
/**
 * ElementHandle represents an in-page DOM element.
 *
 * @remarks
 *
 * ElementHandles can be created with the {@link Page.$} method.
 *
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *  const browser = await puppeteer.launch();
 *  const page = await browser.newPage();
 *  await page.goto('https://example.com');
 *  const hrefElement = await page.$('a');
 *  await hrefElement.click();
 *  // ...
 * })();
 * ```
 *
 * ElementHandle prevents the DOM element from being garbage-collected unless the
 * handle is {@link JSHandle.dispose | disposed}. ElementHandles are auto-disposed
 * when their origin frame gets navigated.
 *
 * ElementHandle instances can be used as arguments in {@link Page.$eval} and
 * {@link Page.evaluate} methods.
 *
 * If you're using TypeScript, ElementHandle takes a generic argument that
 * denotes the type of element the handle is holding within. For example, if you
 * have a handle to a `<select>` element, you can type it as
 * `ElementHandle<HTMLSelectElement>` and you get some nicer type checks.
 *
 * @public
 */
export declare class ElementHandle<ElementType extends Element = Element> extends JSHandle {
    private _page;
    private _frameManager;
    /**
     * @internal
     */
    constructor(context: ExecutionContext, client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject, page: Page, frameManager: FrameManager);
    asElement(): ElementHandle<ElementType> | null;
    /**
     * Resolves to the content frame for element handles referencing
     * iframe nodes, or null otherwise
     */
    contentFrame(): Promise<Frame | null>;
    private _scrollIntoViewIfNeeded;
    private _clickablePoint;
    private _getBoxModel;
    private _fromProtocolQuad;
    private _intersectQuadWithViewport;
    /**
     * This method scrolls element into view if needed, and then
     * uses {@link Page.mouse} to hover over the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    hover(): Promise<void>;
    /**
     * This method scrolls element into view if needed, and then
     * uses {@link Page.mouse} to click in the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    click(options?: ClickOptions): Promise<void>;
    /**
     * Triggers a `change` and `input` event once all the provided options have been
     * selected. If there's no `<select>` element matching `selector`, the method
     * throws an error.
     *
     * @example
     * ```js
     * handle.select('blue'); // single selection
     * handle.select('red', 'green', 'blue'); // multiple selections
     * ```
     * @param values - Values of options to select. If the `<select>` has the
     *    `multiple` attribute, all values are considered, otherwise only the first
     *    one is taken into account.
     */
    select(...values: string[]): Promise<string[]>;
    /**
     * This method expects `elementHandle` to point to an
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input | input element}.
     * @param filePaths - Sets the value of the file input to these paths.
     *    If some of the  `filePaths` are relative paths, then they are resolved
     *    relative to the {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}
     */
    uploadFile(...filePaths: string[]): Promise<void>;
    /**
     * This method scrolls element into view if needed, and then uses
     * {@link Touchscreen.tap} to tap in the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    tap(): Promise<void>;
    /**
     * Calls {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus | focus} on the element.
     */
    focus(): Promise<void>;
    /**
     * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and
     * `keyup` event for each character in the text.
     *
     * To press a special key, like `Control` or `ArrowDown`,
     * use {@link ElementHandle.press}.
     *
     * @example
     * ```js
     * await elementHandle.type('Hello'); // Types instantly
     * await elementHandle.type('World', {delay: 100}); // Types slower, like a user
     * ```
     *
     * @example
     * An example of typing into a text field and then submitting the form:
     *
     * ```js
     * const elementHandle = await page.$('input');
     * await elementHandle.type('some text');
     * await elementHandle.press('Enter');
     * ```
     */
    type(text: string, options?: {
        delay: number;
    }): Promise<void>;
    /**
     * Focuses the element, and then uses {@link Keyboard.down} and {@link Keyboard.up}.
     *
     * @remarks
     * If `key` is a single character and no modifier keys besides `Shift`
     * are being held down, a `keypress`/`input` event will also be generated.
     * The `text` option can be specified to force an input event to be generated.
     *
     * **NOTE** Modifier keys DO affect `elementHandle.press`. Holding down `Shift`
     * will type the text in upper case.
     *
     * @param key - Name of key to press, such as `ArrowLeft`.
     *    See {@link KeyInput} for a list of all key names.
     */
    press(key: KeyInput, options?: PressOptions): Promise<void>;
    /**
     * This method returns the bounding box of the element (relative to the main frame),
     * or `null` if the element is not visible.
     */
    boundingBox(): Promise<BoundingBox | null>;
    /**
     * This method returns boxes of the element, or `null` if the element is not visible.
     *
     * @remarks
     *
     * Boxes are represented as an array of points;
     * Each Point is an object `{x, y}`. Box points are sorted clock-wise.
     */
    boxModel(): Promise<BoxModel | null>;
    /**
     * This method scrolls element into view if needed, and then uses
     * {@link Page.screenshot} to take a screenshot of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    screenshot(options?: {}): Promise<string | Buffer | void>;
    /**
     * Runs `element.querySelector` within the page. If no element matches the selector,
     * the return value resolves to `null`.
     */
    $(selector: string): Promise<ElementHandle | null>;
    /**
     * Runs `element.querySelectorAll` within the page. If no elements match the selector,
     * the return value resolves to `[]`.
     */
    $$(selector: string): Promise<ElementHandle[]>;
    /**
     * This method runs `document.querySelector` within the element and passes it as
     * the first argument to `pageFunction`. If there's no element matching `selector`,
     * the method throws an error.
     *
     * If `pageFunction` returns a Promise, then `frame.$eval` would wait for the promise
     * to resolve and return its value.
     *
     * @example
     * ```js
     * const tweetHandle = await page.$('.tweet');
     * expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe('100');
     * expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe('10');
     * ```
     */
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    /**
     * This method runs `document.querySelectorAll` within the element and passes it as
     * the first argument to `pageFunction`. If there's no element matching `selector`,
     * the method throws an error.
     *
     * If `pageFunction` returns a Promise, then `frame.$$eval` would wait for the
     * promise to resolve and return its value.
     *
     * @example
     * ```html
     * <div class="feed">
     *   <div class="tweet">Hello!</div>
     *   <div class="tweet">Hi!</div>
     * </div>
     * ```
     *
     * @example
     * ```js
     * const feedHandle = await page.$('.feed');
     * expect(await feedHandle.$$eval('.tweet', nodes => nodes.map(n => n.innerText)))
     *  .toEqual(['Hello!', 'Hi!']);
     * ```
     */
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    /**
     * The method evaluates the XPath expression relative to the elementHandle.
     * If there are no such elements, the method will resolve to an empty array.
     * @param expression - Expression to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate | evaluate}
     */
    $x(expression: string): Promise<ElementHandle[]>;
    /**
     * Resolves to true if the element is visible in the current viewport.
     */
    isIntersectingViewport(): Promise<boolean>;
}
/**
 * @public
 */
export interface ClickOptions {
    /**
     * Time to wait between `mousedown` and `mouseup` in milliseconds.
     *
     * @defaultValue 0
     */
    delay?: number;
    /**
     * @defaultValue 'left'
     */
    button?: 'left' | 'right' | 'middle';
    /**
     * @defaultValue 1
     */
    clickCount?: number;
}
/**
 * @public
 */
export interface PressOptions {
    /**
     * Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
     */
    delay?: number;
    /**
     * If specified, generates an input event with this text.
     */
    text?: string;
}
//# sourceMappingURL=JSHandle.d.ts.map