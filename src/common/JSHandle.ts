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

import { Protocol } from 'devtools-protocol';
import { assert } from './assert.js';
import { CDPSession } from './Connection.js';
import {
  EvaluateFn,
  EvaluateFnReturnType,
  EvaluateHandleFn,
  SerializableOrJSHandle,
  UnwrapPromiseLike,
  WrapElementHandle,
} from './EvalTypes.js';
import { ExecutionContext } from './ExecutionContext.js';
import { Frame, FrameManager } from './FrameManager.js';
import { debugError, helper } from './helper.js';
import { MouseButton } from './Input.js';
import { Page, ScreenshotOptions } from './Page.js';
import { _getQueryHandlerAndSelector } from './QueryHandler.js';
import { KeyInput } from './USKeyboardLayout.js';

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
 * @internal
 */
export function _createJSHandle(
  context: ExecutionContext,
  remoteObject: Protocol.Runtime.RemoteObject
): JSHandle {
  const frame = context.frame();
  if (remoteObject.subtype === 'node' && frame) {
    const frameManager = frame._frameManager;
    return new ElementHandle(
      context,
      context._client,
      remoteObject,
      frame,
      frameManager.page(),
      frameManager
    );
  }
  return new JSHandle(context, context._client, remoteObject);
}

const applyOffsetsToQuad = (quad: Point[], offsetX: number, offsetY: number) =>
  quad.map((part) => ({ x: part.x + offsetX, y: part.y + offsetY }));

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
export class JSHandle<HandleObjectType = unknown> {
  #client: CDPSession;
  #disposed = false;
  #context: ExecutionContext;
  #remoteObject: Protocol.Runtime.RemoteObject;

  /**
   * @internal
   */
  get _client(): CDPSession {
    return this.#client;
  }

  /**
   * @internal
   */
  get _disposed(): boolean {
    return this.#disposed;
  }

  /**
   * @internal
   */
  get _remoteObject(): Protocol.Runtime.RemoteObject {
    return this.#remoteObject;
  }

  /**
   * @internal
   */
  get _context(): ExecutionContext {
    return this.#context;
  }

  /**
   * @internal
   */
  constructor(
    context: ExecutionContext,
    client: CDPSession,
    remoteObject: Protocol.Runtime.RemoteObject
  ) {
    this.#context = context;
    this.#client = client;
    this.#remoteObject = remoteObject;
  }

  /** Returns the execution context the handle belongs to.
   */
  executionContext(): ExecutionContext {
    return this.#context;
  }

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

  async evaluate<T extends EvaluateFn<HandleObjectType>>(
    pageFunction: T | string,
    ...args: SerializableOrJSHandle[]
  ): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>> {
    return await this.executionContext().evaluate<
      UnwrapPromiseLike<EvaluateFnReturnType<T>>
    >(pageFunction, this, ...args);
  }

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
  async evaluateHandle<HandleType extends JSHandle = JSHandle>(
    pageFunction: EvaluateHandleFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<HandleType> {
    return await this.executionContext().evaluateHandle(
      pageFunction,
      this,
      ...args
    );
  }

  /** Fetches a single property from the referenced object.
   */
  async getProperty(propertyName: string): Promise<JSHandle> {
    const objectHandle = await this.evaluateHandle(
      (object: Element, propertyName: keyof Element) => {
        const result: Record<string, unknown> = { __proto__: null };
        result[propertyName] = object[propertyName];
        return result;
      },
      propertyName
    );
    const properties = await objectHandle.getProperties();
    const result = properties.get(propertyName);
    assert(result instanceof JSHandle);
    await objectHandle.dispose();
    return result;
  }

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
  async getProperties(): Promise<Map<string, JSHandle>> {
    assert(this.#remoteObject.objectId);
    const response = await this.#client.send('Runtime.getProperties', {
      objectId: this.#remoteObject.objectId,
      ownProperties: true,
    });
    const result = new Map<string, JSHandle>();
    for (const property of response.result) {
      if (!property.enumerable || !property.value) continue;
      result.set(property.name, _createJSHandle(this.#context, property.value));
    }
    return result;
  }

  /**
   * @returns Returns a JSON representation of the object.If the object has a
   * `toJSON` function, it will not be called.
   * @remarks
   *
   * The JSON is generated by running {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | JSON.stringify}
   * on the object in page and consequent {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | JSON.parse} in puppeteer.
   * **NOTE** The method throws if the referenced object is not stringifiable.
   */
  async jsonValue<T = unknown>(): Promise<T> {
    if (this.#remoteObject.objectId) {
      const response = await this.#client.send('Runtime.callFunctionOn', {
        functionDeclaration: 'function() { return this; }',
        objectId: this.#remoteObject.objectId,
        returnByValue: true,
        awaitPromise: true,
      });
      return helper.valueFromRemoteObject(response.result) as T;
    }
    return helper.valueFromRemoteObject(this.#remoteObject) as T;
  }

  /**
   * @returns Either `null` or the object handle itself, if the object
   * handle is an instance of {@link ElementHandle}.
   */
  asElement(): ElementHandle | null {
    /*  This always returns null, but subclasses can override this and return an
         ElementHandle.
     */
    return null;
  }

  /**
   * Stops referencing the element handle, and resolves when the object handle is
   * successfully disposed of.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    await helper.releaseObject(this.#client, this.#remoteObject);
  }

  /**
   * Returns a string representation of the JSHandle.
   *
   * @remarks Useful during debugging.
   */
  toString(): string {
    if (this.#remoteObject.objectId) {
      const type = this.#remoteObject.subtype || this.#remoteObject.type;
      return 'JSHandle@' + type;
    }
    return 'JSHandle:' + helper.valueFromRemoteObject(this.#remoteObject);
  }
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
export class ElementHandle<
  ElementType extends Element = Element
> extends JSHandle<ElementType> {
  #frame: Frame;
  #page: Page;
  #frameManager: FrameManager;

  /**
   * @internal
   */
  constructor(
    context: ExecutionContext,
    client: CDPSession,
    remoteObject: Protocol.Runtime.RemoteObject,
    frame: Frame,
    page: Page,
    frameManager: FrameManager
  ) {
    super(context, client, remoteObject);
    this.#frame = frame;
    this.#page = page;
    this.#frameManager = frameManager;
  }

  /**
   * Wait for the `selector` to appear within the element. If at the moment of calling the
   * method the `selector` already exists, the method will return immediately. If
   * the `selector` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * This method does not work across navigations or if the element is detached from DOM.
   *
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * of an element to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when element specified by selector string
   * is added to DOM. Resolves to `null` if waiting for hidden: `true` and
   * selector is not found in DOM.
   * @remarks
   * The optional parameters in `options` are:
   *
   * - `visible`: wait for the selected element to be present in DOM and to be
   * visible, i.e. to not have `display: none` or `visibility: hidden` CSS
   * properties. Defaults to `false`.
   *
   * - `hidden`: wait for the selected element to not be found in the DOM or to be hidden,
   * i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to
   * `false`.
   *
   * - `timeout`: maximum time to wait in milliseconds. Defaults to `30000`
   * (30 seconds). Pass `0` to disable timeout. The default value can be changed
   * by using the {@link Page.setDefaultTimeout} method.
   */
  async waitForSelector(
    selector: string,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ElementHandle | null> {
    const frame = this._context.frame();
    assert(frame);
    const secondaryContext = await frame._secondaryWorld.executionContext();
    const adoptedRoot = await secondaryContext._adoptElementHandle(this);
    const handle = await frame._secondaryWorld.waitForSelector(selector, {
      ...options,
      root: adoptedRoot,
    });
    await adoptedRoot.dispose();
    if (!handle) return null;
    const mainExecutionContext = await frame._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  /**
   * Wait for the `xpath` within the element. If at the moment of calling the
   * method the `xpath` already exists, the method will return immediately. If
   * the `xpath` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * If `xpath` starts with `//` instead of `.//`, the dot will be appended automatically.
   *
   * This method works across navigation
   * ```js
   * const puppeteer = require('puppeteer');
   * (async () => {
   * const browser = await puppeteer.launch();
   * const page = await browser.newPage();
   * let currentURL;
   * page
   * .waitForXPath('//img')
   * .then(() => console.log('First URL with image: ' + currentURL));
   * for (currentURL of [
   * 'https://example.com',
   * 'https://google.com',
   * 'https://bbc.com',
   * ]) {
   * await page.goto(currentURL);
   * }
   * await browser.close();
   * })();
   * ```
   * @param xpath - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/XPath | xpath} of an
   * element to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when element specified by xpath string is
   * added to DOM. Resolves to `null` if waiting for `hidden: true` and xpath is
   * not found in DOM.
   * @remarks
   * The optional Argument `options` have properties:
   *
   * - `visible`: A boolean to wait for element to be present in DOM and to be
   * visible, i.e. to not have `display: none` or `visibility: hidden` CSS
   * properties. Defaults to `false`.
   *
   * - `hidden`: A boolean wait for element to not be found in the DOM or to be
   * hidden, i.e. have `display: none` or `visibility: hidden` CSS properties.
   * Defaults to `false`.
   *
   * - `timeout`: A number which is maximum time to wait for in milliseconds.
   * Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default
   * value can be changed by using the {@link Page.setDefaultTimeout} method.
   */
  async waitForXPath(
    xpath: string,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ElementHandle | null> {
    const frame = this._context.frame();
    assert(frame);
    const secondaryContext = await frame._secondaryWorld.executionContext();
    const adoptedRoot = await secondaryContext._adoptElementHandle(this);
    xpath = xpath.startsWith('//') ? '.' + xpath : xpath;
    if (!xpath.startsWith('.//')) {
      await adoptedRoot.dispose();
      throw new Error('Unsupported xpath expression: ' + xpath);
    }
    const handle = await frame._secondaryWorld.waitForXPath(xpath, {
      ...options,
      root: adoptedRoot,
    });
    await adoptedRoot.dispose();
    if (!handle) return null;
    const mainExecutionContext = await frame._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  override asElement(): ElementHandle<ElementType> | null {
    return this;
  }

  /**
   * Resolves to the content frame for element handles referencing
   * iframe nodes, or null otherwise
   */
  async contentFrame(): Promise<Frame | null> {
    const nodeInfo = await this._client.send('DOM.describeNode', {
      objectId: this._remoteObject.objectId,
    });
    if (typeof nodeInfo.node.frameId !== 'string') return null;
    return this.#frameManager.frame(nodeInfo.node.frameId);
  }

  async #scrollIntoViewIfNeeded(): Promise<void> {
    const error = await this.evaluate(
      async (
        element: Element,
        pageJavascriptEnabled: boolean
      ): Promise<string | false> => {
        if (!element.isConnected) return 'Node is detached from document';
        if (element.nodeType !== Node.ELEMENT_NODE)
          return 'Node is not of type HTMLElement';
        // force-scroll if page's javascript is disabled.
        if (!pageJavascriptEnabled) {
          element.scrollIntoView({
            block: 'center',
            inline: 'center',
            // @ts-expect-error Chrome still supports behavior: instant but
            // it's not in the spec so TS shouts We don't want to make this
            // breaking change in Puppeteer yet so we'll ignore the line.
            behavior: 'instant',
          });
          return false;
        }
        const visibleRatio = await new Promise((resolve) => {
          const observer = new IntersectionObserver((entries) => {
            resolve(entries[0]!.intersectionRatio);
            observer.disconnect();
          });
          observer.observe(element);
        });
        if (visibleRatio !== 1.0) {
          element.scrollIntoView({
            block: 'center',
            inline: 'center',
            // @ts-expect-error Chrome still supports behavior: instant but
            // it's not in the spec so TS shouts We don't want to make this
            // breaking change in Puppeteer yet so we'll ignore the line.
            behavior: 'instant',
          });
        }
        return false;
      },
      this.#page.isJavaScriptEnabled()
    );

    if (error) throw new Error(error);
  }

  async #getOOPIFOffsets(
    frame: Frame
  ): Promise<{ offsetX: number; offsetY: number }> {
    let offsetX = 0;
    let offsetY = 0;
    let currentFrame: Frame | null = frame;
    while (currentFrame && currentFrame.parentFrame()) {
      const parent = currentFrame.parentFrame();
      if (!currentFrame.isOOPFrame() || !parent) {
        currentFrame = parent;
        continue;
      }
      const { backendNodeId } = await parent
        ._client()
        .send('DOM.getFrameOwner', {
          frameId: currentFrame._id,
        });
      const result = await parent._client().send('DOM.getBoxModel', {
        backendNodeId: backendNodeId,
      });
      if (!result) {
        break;
      }
      const contentBoxQuad = result.model.content;
      const topLeftCorner = this.#fromProtocolQuad(contentBoxQuad)[0];
      offsetX += topLeftCorner!.x;
      offsetY += topLeftCorner!.y;
      currentFrame = parent;
    }
    return { offsetX, offsetY };
  }

  /**
   * Returns the middle point within an element unless a specific offset is provided.
   */
  async clickablePoint(offset?: Offset): Promise<Point> {
    const [result, layoutMetrics] = await Promise.all([
      this._client
        .send('DOM.getContentQuads', {
          objectId: this._remoteObject.objectId,
        })
        .catch(debugError),
      this.#page._client().send('Page.getLayoutMetrics'),
    ]);
    if (!result || !result.quads.length)
      throw new Error('Node is either not clickable or not an HTMLElement');
    // Filter out quads that have too small area to click into.
    // Fallback to `layoutViewport` in case of using Firefox.
    const { clientWidth, clientHeight } =
      layoutMetrics.cssLayoutViewport || layoutMetrics.layoutViewport;
    const { offsetX, offsetY } = await this.#getOOPIFOffsets(this.#frame);
    const quads = result.quads
      .map((quad) => this.#fromProtocolQuad(quad))
      .map((quad) => applyOffsetsToQuad(quad, offsetX, offsetY))
      .map((quad) =>
        this.#intersectQuadWithViewport(quad, clientWidth, clientHeight)
      )
      .filter((quad) => computeQuadArea(quad) > 1);
    if (!quads.length)
      throw new Error('Node is either not clickable or not an HTMLElement');
    const quad = quads[0]!;
    if (offset) {
      // Return the point of the first quad identified by offset.
      let minX = Number.MAX_SAFE_INTEGER;
      let minY = Number.MAX_SAFE_INTEGER;
      for (const point of quad) {
        if (point.x < minX) {
          minX = point.x;
        }
        if (point.y < minY) {
          minY = point.y;
        }
      }
      if (
        minX !== Number.MAX_SAFE_INTEGER &&
        minY !== Number.MAX_SAFE_INTEGER
      ) {
        return {
          x: minX + offset.x,
          y: minY + offset.y,
        };
      }
    }
    // Return the middle point of the first quad.
    let x = 0;
    let y = 0;
    for (const point of quad) {
      x += point.x;
      y += point.y;
    }
    return {
      x: x / 4,
      y: y / 4,
    };
  }

  #getBoxModel(): Promise<void | Protocol.DOM.GetBoxModelResponse> {
    const params: Protocol.DOM.GetBoxModelRequest = {
      objectId: this._remoteObject.objectId,
    };
    return this._client
      .send('DOM.getBoxModel', params)
      .catch((error) => debugError(error));
  }

  #fromProtocolQuad(quad: number[]): Point[] {
    return [
      { x: quad[0]!, y: quad[1]! },
      { x: quad[2]!, y: quad[3]! },
      { x: quad[4]!, y: quad[5]! },
      { x: quad[6]!, y: quad[7]! },
    ];
  }

  #intersectQuadWithViewport(
    quad: Point[],
    width: number,
    height: number
  ): Point[] {
    return quad.map((point) => ({
      x: Math.min(Math.max(point.x, 0), width),
      y: Math.min(Math.max(point.y, 0), height),
    }));
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to hover over the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async hover(): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const { x, y } = await this.clickablePoint();
    await this.#page.mouse.move(x, y);
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to click in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async click(options: ClickOptions = {}): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const { x, y } = await this.clickablePoint(options.offset);
    await this.#page.mouse.click(x, y, options);
  }

  /**
   * This method creates and captures a dragevent from the element.
   */
  async drag(target: Point): Promise<Protocol.Input.DragData> {
    assert(
      this.#page.isDragInterceptionEnabled(),
      'Drag Interception is not enabled!'
    );
    await this.#scrollIntoViewIfNeeded();
    const start = await this.clickablePoint();
    return await this.#page.mouse.drag(start, target);
  }

  /**
   * This method creates a `dragenter` event on the element.
   */
  async dragEnter(
    data: Protocol.Input.DragData = { items: [], dragOperationsMask: 1 }
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragEnter(target, data);
  }

  /**
   * This method creates a `dragover` event on the element.
   */
  async dragOver(
    data: Protocol.Input.DragData = { items: [], dragOperationsMask: 1 }
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragOver(target, data);
  }

  /**
   * This method triggers a drop on the element.
   */
  async drop(
    data: Protocol.Input.DragData = { items: [], dragOperationsMask: 1 }
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const destination = await this.clickablePoint();
    await this.#page.mouse.drop(destination, data);
  }

  /**
   * This method triggers a dragenter, dragover, and drop on the element.
   */
  async dragAndDrop(
    target: ElementHandle,
    options?: { delay: number }
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const startPoint = await this.clickablePoint();
    const targetPoint = await target.clickablePoint();
    await this.#page.mouse.dragAndDrop(startPoint, targetPoint, options);
  }

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
  async select(...values: string[]): Promise<string[]> {
    for (const value of values) {
      assert(
        helper.isString(value),
        'Values must be strings. Found value "' +
          value +
          '" of type "' +
          typeof value +
          '"'
      );
    }

    return this.evaluate((element: Element, vals: string[]): string[] => {
      const values = new Set(vals);
      if (!(element instanceof HTMLSelectElement)) {
        throw new Error('Element is not a <select> element.');
      }

      const selectedValues = new Set<string>();
      if (!element.multiple) {
        for (const option of element.options) {
          option.selected = false;
        }
        for (const option of element.options) {
          if (values.has(option.value)) {
            option.selected = true;
            selectedValues.add(option.value);
            break;
          }
        }
      } else {
        for (const option of element.options) {
          option.selected = values.has(option.value);
          if (option.selected) {
            selectedValues.add(option.value);
          }
        }
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return [...selectedValues.values()];
    }, values);
  }

  /**
   * This method expects `elementHandle` to point to an
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input | input element}.
   *
   * @param filePaths - Sets the value of the file input to these paths.
   *    If a path is relative, then it is resolved against the
   *    {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
   *    Note for locals script connecting to remote chrome environments,
   *    paths must be absolute.
   */
  async uploadFile(...filePaths: string[]): Promise<void> {
    const isMultiple = await this.evaluate<(element: Element) => boolean>(
      (element) => {
        if (!(element instanceof HTMLInputElement)) {
          throw new Error('uploadFile can only be called on an input element.');
        }
        return element.multiple;
      }
    );
    assert(
      filePaths.length <= 1 || isMultiple,
      'Multiple file uploads only work with <input type=file multiple>'
    );

    // Locate all files and confirm that they exist.
    let path: typeof import('path');
    try {
      path = await import('path');
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `JSHandle#uploadFile can only be used in Node-like environments.`
        );
      }
      throw error;
    }
    const files = filePaths.map((filePath) => {
      if (path.win32.isAbsolute(filePath) || path.posix.isAbsolute(filePath)) {
        return filePath;
      } else {
        return path.resolve(filePath);
      }
    });
    const { objectId } = this._remoteObject;
    const { node } = await this._client.send('DOM.describeNode', { objectId });
    const { backendNodeId } = node;

    /*  The zero-length array is a special case, it seems that
         DOM.setFileInputFiles does not actually update the files in that case,
         so the solution is to eval the element value to a new FileList directly.
     */
    if (files.length === 0) {
      await (this as ElementHandle<HTMLInputElement>).evaluate((element) => {
        element.files = new DataTransfer().files;

        // Dispatch events for this case because it should behave akin to a user action.
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else {
      await this._client.send('DOM.setFileInputFiles', {
        objectId,
        files,
        backendNodeId,
      });
    }
  }

  /**
   * This method scrolls element into view if needed, and then uses
   * {@link Touchscreen.tap} to tap in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async tap(): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const { x, y } = await this.clickablePoint();
    await this.#page.touchscreen.tap(x, y);
  }

  /**
   * Calls {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus | focus} on the element.
   */
  async focus(): Promise<void> {
    await (this as ElementHandle<HTMLElement>).evaluate((element) =>
      element.focus()
    );
  }

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
  async type(text: string, options?: { delay: number }): Promise<void> {
    await this.focus();
    await this.#page.keyboard.type(text, options);
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
   *    See {@link KeyInput} for a list of all key names.
   */
  async press(key: KeyInput, options?: PressOptions): Promise<void> {
    await this.focus();
    await this.#page.keyboard.press(key, options);
  }

  /**
   * This method returns the bounding box of the element (relative to the main frame),
   * or `null` if the element is not visible.
   */
  async boundingBox(): Promise<BoundingBox | null> {
    const result = await this.#getBoxModel();

    if (!result) return null;

    const { offsetX, offsetY } = await this.#getOOPIFOffsets(this.#frame);
    const quad = result.model.border;
    const x = Math.min(quad[0]!, quad[2]!, quad[4]!, quad[6]!);
    const y = Math.min(quad[1]!, quad[3]!, quad[5]!, quad[7]!);
    const width = Math.max(quad[0]!, quad[2]!, quad[4]!, quad[6]!) - x;
    const height = Math.max(quad[1]!, quad[3]!, quad[5]!, quad[7]!) - y;

    return { x: x + offsetX, y: y + offsetY, width, height };
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
    const result = await this.#getBoxModel();

    if (!result) return null;

    const { offsetX, offsetY } = await this.#getOOPIFOffsets(this.#frame);

    const { content, padding, border, margin, width, height } = result.model;
    return {
      content: applyOffsetsToQuad(
        this.#fromProtocolQuad(content),
        offsetX,
        offsetY
      ),
      padding: applyOffsetsToQuad(
        this.#fromProtocolQuad(padding),
        offsetX,
        offsetY
      ),
      border: applyOffsetsToQuad(
        this.#fromProtocolQuad(border),
        offsetX,
        offsetY
      ),
      margin: applyOffsetsToQuad(
        this.#fromProtocolQuad(margin),
        offsetX,
        offsetY
      ),
      width,
      height,
    };
  }

  /**
   * This method scrolls element into view if needed, and then uses
   * {@link Page.screenshot} to take a screenshot of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async screenshot(options: ScreenshotOptions = {}): Promise<string | Buffer> {
    let needsViewportReset = false;

    let boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');

    const viewport = this.#page.viewport();
    assert(viewport);

    if (
      boundingBox.width > viewport.width ||
      boundingBox.height > viewport.height
    ) {
      const newViewport = {
        width: Math.max(viewport.width, Math.ceil(boundingBox.width)),
        height: Math.max(viewport.height, Math.ceil(boundingBox.height)),
      };
      await this.#page.setViewport(Object.assign({}, viewport, newViewport));

      needsViewportReset = true;
    }

    await this.#scrollIntoViewIfNeeded();

    boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');
    assert(boundingBox.width !== 0, 'Node has 0 width.');
    assert(boundingBox.height !== 0, 'Node has 0 height.');

    const layoutMetrics = await this._client.send('Page.getLayoutMetrics');
    // Fallback to `layoutViewport` in case of using Firefox.
    const { pageX, pageY } =
      layoutMetrics.cssVisualViewport || layoutMetrics.layoutViewport;

    const clip = Object.assign({}, boundingBox);
    clip.x += pageX;
    clip.y += pageY;

    const imageData = await this.#page.screenshot(
      Object.assign(
        {},
        {
          clip,
        },
        options
      )
    );

    if (needsViewportReset) await this.#page.setViewport(viewport);

    return imageData;
  }

  /**
   * Runs `element.querySelector` within the page.
   *
   * @param selector - The selector to query with.
   * @returns `null` if no element matches the selector.
   * @throws `Error` if the selector has no associated query handler.
   */
  async $<T extends Element = Element>(
    selector: string
  ): Promise<ElementHandle<T> | null> {
    const { updatedSelector, queryHandler } =
      _getQueryHandlerAndSelector(selector);
    assert(
      queryHandler.queryOne,
      'Cannot handle queries for a single element with the given selector'
    );
    return queryHandler.queryOne(this, updatedSelector);
  }

  /**
   * Runs `element.querySelectorAll` within the page. If no elements match the selector,
   * the return value resolves to `[]`.
   */
  /**
   * Runs `element.querySelectorAll` within the page.
   *
   * @param selector - The selector to query with.
   * @returns `[]` if no element matches the selector.
   * @throws `Error` if the selector has no associated query handler.
   */
  async $$<T extends Element = Element>(
    selector: string
  ): Promise<Array<ElementHandle<T>>> {
    const { updatedSelector, queryHandler } =
      _getQueryHandlerAndSelector(selector);
    assert(
      queryHandler.queryAll,
      'Cannot handle queries for a multiple element with the given selector'
    );
    return queryHandler.queryAll(this, updatedSelector);
  }

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
  async $eval<ReturnType>(
    selector: string,
    pageFunction: (
      element: Element,
      ...args: unknown[]
    ) => ReturnType | Promise<ReturnType>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    const elementHandle = await this.$(selector);
    if (!elementHandle)
      throw new Error(
        `Error: failed to find element matching selector "${selector}"`
      );
    const result = await elementHandle.evaluate<
      (
        element: Element,
        ...args: SerializableOrJSHandle[]
      ) => ReturnType | Promise<ReturnType>
    >(pageFunction, ...args);
    await elementHandle.dispose();

    /**
     * This `as` is a little unfortunate but helps TS understand the behavior of
     * `elementHandle.evaluate`. If evaluate returns an element it will return an
     * ElementHandle instance, rather than the plain object. All the
     * WrapElementHandle type does is wrap ReturnType into
     * ElementHandle<ReturnType> if it is an ElementHandle, or leave it alone as
     * ReturnType if it isn't.
     */
    return result as WrapElementHandle<ReturnType>;
  }

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
  async $$eval<ReturnType>(
    selector: string,
    pageFunction: EvaluateFn<
      Element[],
      unknown,
      ReturnType | Promise<ReturnType>
    >,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    const { updatedSelector, queryHandler } =
      _getQueryHandlerAndSelector(selector);
    assert(queryHandler.queryAllArray);
    const arrayHandle = await queryHandler.queryAllArray(this, updatedSelector);
    const result = await arrayHandle.evaluate<EvaluateFn<Element[]>>(
      pageFunction,
      ...args
    );
    await arrayHandle.dispose();
    /* This `as` exists for the same reason as the `as` in $eval above.
     * See the comment there for a full explanation.
     */
    return result as WrapElementHandle<ReturnType>;
  }

  /**
   * The method evaluates the XPath expression relative to the elementHandle.
   * If there are no such elements, the method will resolve to an empty array.
   * @param expression - Expression to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate | evaluate}
   */
  async $x(expression: string): Promise<ElementHandle[]> {
    const arrayHandle = await this.evaluateHandle(
      (element: Document, expression: string) => {
        const document = element.ownerDocument || element;
        const iterator = document.evaluate(
          expression,
          element,
          null,
          XPathResult.ORDERED_NODE_ITERATOR_TYPE
        );
        const array = [];
        let item;
        while ((item = iterator.iterateNext())) array.push(item);
        return array;
      },
      expression
    );
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
      const elementHandle = property.asElement();
      if (elementHandle) result.push(elementHandle);
    }
    return result;
  }

  /**
   * Resolves to true if the element is visible in the current viewport.
   */
  async isIntersectingViewport(options?: {
    threshold?: number;
  }): Promise<boolean> {
    const { threshold = 0 } = options || {};
    return await this.evaluate(async (element: Element, threshold: number) => {
      const visibleRatio = await new Promise<number>((resolve) => {
        const observer = new IntersectionObserver((entries) => {
          resolve(entries[0]!.intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
      });
      return threshold === 1 ? visibleRatio === 1 : visibleRatio > threshold;
    }, threshold);
  }
}

/**
 * @public
 */
export interface Offset {
  /**
   * x-offset for the clickable point relative to the top-left corder of the border box.
   */
  x: number;
  /**
   * y-offset for the clickable point relative to the top-left corder of the border box.
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
   * Offset for the clickable point relative to the top-left corder of the border box.
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

function computeQuadArea(quad: Point[]): number {
  /* Compute sum of all directed areas of adjacent triangles
     https://en.wikipedia.org/wiki/Polygon#Simple_polygons
   */
  let area = 0;
  for (let i = 0; i < quad.length; ++i) {
    const p1 = quad[i]!;
    const p2 = quad[(i + 1) % quad.length]!;
    area += (p1.x * p2.y - p2.x * p1.y) / 2;
  }
  return Math.abs(area);
}
