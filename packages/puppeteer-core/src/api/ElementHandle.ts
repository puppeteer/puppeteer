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

import {Protocol} from 'devtools-protocol';
import {Frame} from '../common/Frame.js';
import {WaitForSelectorOptions} from '../common/IsolatedWorld.js';
import {JSHandle} from './JSHandle.js';
import {ScreenshotOptions} from './Page.js';
import {ElementFor, EvaluateFunc, HandleFor, NodeFor} from '../common/types.js';
import {KeyInput} from '../common/USKeyboardLayout.js';
import {MouseButton} from '../common/Input.js';

/**
 * @public
 */
export interface BoxModel {
  content: Point[];
  padding: Point[];
  border: Point[];
  margin: Point[];
  width: number;
  height: number;
}

/**
 * @public
 */
export interface BoundingBox extends Point {
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
 * @public
 */
export interface Offset {
  /**
   * x-offset for the clickable point relative to the top-left corner of the border box.
   */
  x: number;
  /**
   * y-offset for the clickable point relative to the top-left corner of the border box.
   */
  y: number;
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
  button?: MouseButton;
  /**
   * @defaultValue 1
   */
  clickCount?: number;
  /**
   * Offset for the clickable point relative to the top-left corner of the border box.
   */
  offset?: Offset;
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

/**
 * @public
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * ElementHandle represents an in-page DOM element.
 *
 * @remarks
 * ElementHandles can be created with the {@link Page.$} method.
 *
 * ```ts
 * import puppeteer from 'puppeteer';
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://example.com');
 *   const hrefElement = await page.$('a');
 *   await hrefElement.click();
 *   // ...
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

export class ElementHandle<
  ElementType extends Node = Element
> extends JSHandle<ElementType> {
  get frame(): Frame {
    throw new Error('Not implemented');
  }

  /**
   * Queries the current element for an element matching the given selector.
   *
   * @param selector - The selector to query for.
   * @returns A {@link ElementHandle | element handle} to the first element
   * matching the given selector. Otherwise, `null`.
   */
  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
  async $<Selector extends string>(): Promise<ElementHandle<
    NodeFor<Selector>
  > | null> {
    throw new Error('Not implemented');
  }

  /**
   * Queries the current element for all elements matching the given selector.
   *
   * @param selector - The selector to query for.
   * @returns An array of {@link ElementHandle | element handles} that point to
   * elements matching the given selector.
   */
  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>>;
  async $$<Selector extends string>(): Promise<
    Array<ElementHandle<NodeFor<Selector>>>
  > {
    throw new Error('Not implemented');
  }

  /**
   * Runs the given function on the first element matching the given selector in
   * the current element.
   *
   * If the given function returns a promise, then this method will wait till
   * the promise resolves.
   *
   * @example
   *
   * ```ts
   * const tweetHandle = await page.$('.tweet');
   * expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe(
   *   '100'
   * );
   * expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe(
   *   '10'
   * );
   * ```
   *
   * @param selector - The selector to query for.
   * @param pageFunction - The function to be evaluated in this element's page's
   * context. The first element matching the selector will be passed in as the
   * first argument.
   * @param args - Additional arguments to pass to `pageFunction`.
   * @returns A promise to the result of the function.
   */
  async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [ElementHandle<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[ElementHandle<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [ElementHandle<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[ElementHandle<NodeFor<Selector>>, ...Params]>
  >(): Promise<Awaited<ReturnType<Func>>> {
    throw new Error('Not implemented');
  }

  /**
   * Runs the given function on an array of elements matching the given selector
   * in the current element.
   *
   * If the given function returns a promise, then this method will wait till
   * the promise resolves.
   *
   * @example
   * HTML:
   *
   * ```html
   * <div class="feed">
   *   <div class="tweet">Hello!</div>
   *   <div class="tweet">Hi!</div>
   * </div>
   * ```
   *
   * JavaScript:
   *
   * ```js
   * const feedHandle = await page.$('.feed');
   * expect(
   *   await feedHandle.$$eval('.tweet', nodes => nodes.map(n => n.innerText))
   * ).toEqual(['Hello!', 'Hi!']);
   * ```
   *
   * @param selector - The selector to query for.
   * @param pageFunction - The function to be evaluated in the element's page's
   * context. An array of elements matching the given selector will be passed to
   * the function as its first argument.
   * @param args - Additional arguments to pass to `pageFunction`.
   * @returns A promise to the result of the function.
   */
  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [HandleFor<Array<NodeFor<Selector>>>, ...Params]
    > = EvaluateFunc<[HandleFor<Array<NodeFor<Selector>>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [HandleFor<Array<NodeFor<Selector>>>, ...Params]
    > = EvaluateFunc<[HandleFor<Array<NodeFor<Selector>>>, ...Params]>
  >(): Promise<Awaited<ReturnType<Func>>> {
    throw new Error('Not implemented');
  }

  /**
   * @deprecated Use {@link ElementHandle.$$} with the `xpath` prefix.
   *
   * Example: `await elementHandle.$$('xpath/' + xpathExpression)`
   *
   * The method evaluates the XPath expression relative to the elementHandle.
   * If `xpath` starts with `//` instead of `.//`, the dot will be appended
   * automatically.
   *
   * If there are no such elements, the method will resolve to an empty array.
   * @param expression - Expression to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate | evaluate}
   */
  async $x(expression: string): Promise<Array<ElementHandle<Node>>>;
  async $x(): Promise<Array<ElementHandle<Node>>> {
    throw new Error('Not implemented');
  }

  /**
   * Wait for an element matching the given selector to appear in the current
   * element.
   *
   * Unlike {@link Frame.waitForSelector}, this method does not work across
   * navigations or if the element is detached from DOM.
   *
   * @example
   *
   * ```ts
   * import puppeteer from 'puppeteer';
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   let currentURL;
   *   page
   *     .mainFrame()
   *     .waitForSelector('img')
   *     .then(() => console.log('First URL with image: ' + currentURL));
   *
   *   for (currentURL of [
   *     'https://example.com',
   *     'https://google.com',
   *     'https://bbc.com',
   *   ]) {
   *     await page.goto(currentURL);
   *   }
   *   await browser.close();
   * })();
   * ```
   *
   * @param selector - The selector to query and wait for.
   * @param options - Options for customizing waiting behavior.
   * @returns An element matching the given selector.
   * @throws Throws if an element matching the given selector doesn't appear.
   */
  async waitForSelector<Selector extends string>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
  async waitForSelector<Selector extends string>(): Promise<ElementHandle<
    NodeFor<Selector>
  > | null> {
    throw new Error('Not implemented');
  }

  /**
   * @deprecated Use {@link ElementHandle.waitForSelector} with the `xpath`
   * prefix.
   *
   * Example: `await elementHandle.waitForSelector('xpath/' + xpathExpression)`
   *
   * The method evaluates the XPath expression relative to the elementHandle.
   *
   * Wait for the `xpath` within the element. If at the moment of calling the
   * method the `xpath` already exists, the method will return immediately. If
   * the `xpath` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * If `xpath` starts with `//` instead of `.//`, the dot will be appended
   * automatically.
   *
   * This method works across navigation.
   *
   * ```ts
   * import puppeteer from 'puppeteer';
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   let currentURL;
   *   page
   *     .waitForXPath('//img')
   *     .then(() => console.log('First URL with image: ' + currentURL));
   *   for (currentURL of [
   *     'https://example.com',
   *     'https://google.com',
   *     'https://bbc.com',
   *   ]) {
   *     await page.goto(currentURL);
   *   }
   *   await browser.close();
   * })();
   * ```
   *
   * @param xpath - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/XPath | xpath} of an
   * element to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when element specified by xpath string is
   * added to DOM. Resolves to `null` if waiting for `hidden: true` and xpath is
   * not found in DOM, otherwise resolves to `ElementHandle`.
   * @remarks
   * The optional Argument `options` have properties:
   *
   * - `visible`: A boolean to wait for element to be present in DOM and to be
   *   visible, i.e. to not have `display: none` or `visibility: hidden` CSS
   *   properties. Defaults to `false`.
   *
   * - `hidden`: A boolean wait for element to not be found in the DOM or to be
   *   hidden, i.e. have `display: none` or `visibility: hidden` CSS properties.
   *   Defaults to `false`.
   *
   * - `timeout`: A number which is maximum time to wait for in milliseconds.
   *   Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The
   *   default value can be changed by using the {@link Page.setDefaultTimeout}
   *   method.
   */
  async waitForXPath(
    xpath: string,
    options?: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    }
  ): Promise<ElementHandle<Node> | null>;
  async waitForXPath(): Promise<ElementHandle<Node> | null> {
    throw new Error('Not implemented');
  }

  /**
   * Converts the current handle to the given element type.
   *
   * @example
   *
   * ```ts
   * const element: ElementHandle<Element> = await page.$(
   *   '.class-name-of-anchor'
   * );
   * // DO NOT DISPOSE `element`, this will be always be the same handle.
   * const anchor: ElementHandle<HTMLAnchorElement> = await element.toElement(
   *   'a'
   * );
   * ```
   *
   * @param tagName - The tag name of the desired element type.
   * @throws An error if the handle does not match. **The handle will not be
   * automatically disposed.**
   */
  async toElement<
    K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
  >(tagName: K): Promise<HandleFor<ElementFor<K>>>;
  async toElement<
    K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
  >(): Promise<HandleFor<ElementFor<K>>> {
    throw new Error('Not implemented');
  }

  override asElement(): ElementHandle<ElementType> | null {
    return this;
  }

  /**
   * Resolves to the content frame for element handles referencing
   * iframe nodes, or null otherwise
   */
  async contentFrame(): Promise<Frame | null> {
    throw new Error('Not implemented');
  }

  /**
   * Returns the middle point within an element unless a specific offset is provided.
   */
  async clickablePoint(offset?: Offset): Promise<Point>;
  async clickablePoint(): Promise<Point> {
    throw new Error('Not implemented');
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to hover over the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async hover(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to click in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async click(
    this: ElementHandle<Element>,
    options?: ClickOptions
  ): Promise<void>;
  async click(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method creates and captures a dragevent from the element.
   */
  async drag(
    this: ElementHandle<Element>,
    target: Point
  ): Promise<Protocol.Input.DragData>;
  async drag(this: ElementHandle<Element>): Promise<Protocol.Input.DragData> {
    throw new Error('Not implemented');
  }

  /**
   * This method creates a `dragenter` event on the element.
   */
  async dragEnter(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
  async dragEnter(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method creates a `dragover` event on the element.
   */
  async dragOver(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
  async dragOver(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method triggers a drop on the element.
   */
  async drop(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
  async drop(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method triggers a dragenter, dragover, and drop on the element.
   */
  async dragAndDrop(
    this: ElementHandle<Element>,
    target: ElementHandle<Node>,
    options?: {delay: number}
  ): Promise<void>;
  async dragAndDrop(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Triggers a `change` and `input` event once all the provided options have been
   * selected. If there's no `<select>` element matching `selector`, the method
   * throws an error.
   *
   * @example
   *
   * ```ts
   * handle.select('blue'); // single selection
   * handle.select('red', 'green', 'blue'); // multiple selections
   * ```
   *
   * @param values - Values of options to select. If the `<select>` has the
   * `multiple` attribute, all values are considered, otherwise only the first
   * one is taken into account.
   */
  async select(...values: string[]): Promise<string[]>;
  async select(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  /**
   * This method expects `elementHandle` to point to an
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input | input element}.
   *
   * @param filePaths - Sets the value of the file input to these paths.
   * If a path is relative, then it is resolved against the
   * {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
   * Note for locals script connecting to remote chrome environments,
   * paths must be absolute.
   */
  async uploadFile(
    this: ElementHandle<HTMLInputElement>,
    ...filePaths: string[]
  ): Promise<void>;
  async uploadFile(this: ElementHandle<HTMLInputElement>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method scrolls element into view if needed, and then uses
   * {@link Touchscreen.tap} to tap in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async tap(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  async touchStart(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  async touchMove(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  async touchEnd(this: ElementHandle<Element>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Calls {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus | focus} on the element.
   */
  async focus(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and
   * `keyup` event for each character in the text.
   *
   * To press a special key, like `Control` or `ArrowDown`,
   * use {@link ElementHandle.press}.
   *
   * @example
   *
   * ```ts
   * await elementHandle.type('Hello'); // Types instantly
   * await elementHandle.type('World', {delay: 100}); // Types slower, like a user
   * ```
   *
   * @example
   * An example of typing into a text field and then submitting the form:
   *
   * ```ts
   * const elementHandle = await page.$('input');
   * await elementHandle.type('some text');
   * await elementHandle.press('Enter');
   * ```
   */
  async type(text: string, options?: {delay: number}): Promise<void>;
  async type(): Promise<void> {
    throw new Error('Not implemented');
  }

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
   * See {@link KeyInput} for a list of all key names.
   */
  async press(key: KeyInput, options?: PressOptions): Promise<void>;
  async press(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * This method returns the bounding box of the element (relative to the main frame),
   * or `null` if the element is not visible.
   */
  async boundingBox(): Promise<BoundingBox | null> {
    throw new Error('Not implemented');
  }

  /**
   * This method returns boxes of the element, or `null` if the element is not visible.
   *
   * @remarks
   *
   * Boxes are represented as an array of points;
   * Each Point is an object `{x, y}`. Box points are sorted clock-wise.
   */
  async boxModel(): Promise<BoxModel | null> {
    throw new Error('Not implemented');
  }

  /**
   * This method scrolls element into view if needed, and then uses
   * {@link Page.screenshot} to take a screenshot of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async screenshot(
    this: ElementHandle<Element>,
    options?: ScreenshotOptions
  ): Promise<string | Buffer>;
  async screenshot(this: ElementHandle<Element>): Promise<string | Buffer> {
    throw new Error('Not implemented');
  }

  /**
   * Resolves to true if the element is visible in the current viewport.
   */
  async isIntersectingViewport(
    this: ElementHandle<Element>,
    options?: {
      threshold?: number;
    }
  ): Promise<boolean>;
  async isIntersectingViewport(): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
