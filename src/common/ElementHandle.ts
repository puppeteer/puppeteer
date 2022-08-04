import {Protocol} from 'devtools-protocol';
import {assert} from './assert.js';
import {CDPSession} from './Connection.js';
import {WaitForSelectorOptions} from './DOMWorld.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame, FrameManager} from './FrameManager.js';
import {
  BoundingBox,
  BoxModel,
  ClickOptions,
  JSHandle,
  Offset,
  Point,
  PressOptions,
} from './JSHandle.js';
import {Page, ScreenshotOptions} from './Page.js';
import {getQueryHandlerAndSelector} from './QueryHandler.js';
import {EvaluateFunc, NodeFor} from './types.js';
import {KeyInput} from './USKeyboardLayout.js';
import {debugError, isString} from './util.js';

const applyOffsetsToQuad = (
  quad: Point[],
  offsetX: number,
  offsetY: number
) => {
  return quad.map(part => {
    return {x: part.x + offsetX, y: part.y + offsetY};
  });
};

/**
 * ElementHandle represents an in-page DOM element.
 *
 * @remarks
 * ElementHandles can be created with the {@link Page.$} method.
 *
 * ```ts
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
  ElementType extends Node = Element
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
  async waitForSelector<Selector extends string>(
    selector: Selector,
    options: Exclude<WaitForSelectorOptions, 'root'> = {}
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const frame = this._context.frame();
    assert(frame);
    const secondaryContext = await frame._secondaryWorld.executionContext();
    const adoptedRoot = await secondaryContext._adoptElementHandle(this);
    const handle = await frame._secondaryWorld.waitForSelector(selector, {
      ...options,
      root: adoptedRoot,
    });
    await adoptedRoot.dispose();
    if (!handle) {
      return null;
    }
    const mainExecutionContext = await frame._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  /**
   * @deprecated Use {@link ElementHandle.waitForSelector} with the `xpath` prefix.
   *
   * Wait for the `xpath` within the element. If at the moment of calling the
   * method the `xpath` already exists, the method will return immediately. If
   * the `xpath` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * If `xpath` starts with `//` instead of `.//`, the dot will be appended automatically.
   *
   * This method works across navigation
   * ```ts
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
  ): Promise<ElementHandle<Node> | null> {
    if (xpath.startsWith('//')) {
      xpath = `.${xpath}`;
    }
    return this.waitForSelector(`xpath/${xpath}`, options);
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
    if (typeof nodeInfo.node.frameId !== 'string') {
      return null;
    }
    return this.#frameManager.frame(nodeInfo.node.frameId);
  }

  async #scrollIntoViewIfNeeded(this: ElementHandle<Element>): Promise<void> {
    const error = await this.evaluate(
      async (element): Promise<string | undefined> => {
        if (!element.isConnected) {
          return 'Node is detached from document';
        }
        if (element.nodeType !== Node.ELEMENT_NODE) {
          return 'Node is not of type HTMLElement';
        }
        return;
      }
    );

    if (error) {
      throw new Error(error);
    }

    try {
      await this._client.send('DOM.scrollIntoViewIfNeeded', {
        objectId: this._remoteObject.objectId,
      });
    } catch (_err) {
      // Fallback to Element.scrollIntoView if DOM.scrollIntoViewIfNeeded is not supported
      await this.evaluate(
        async (element, pageJavascriptEnabled): Promise<void> => {
          const visibleRatio = async () => {
            return await new Promise(resolve => {
              const observer = new IntersectionObserver(entries => {
                resolve(entries[0]!.intersectionRatio);
                observer.disconnect();
              });
              observer.observe(element);
            });
          };
          if (!pageJavascriptEnabled || (await visibleRatio()) !== 1.0) {
            element.scrollIntoView({
              block: 'center',
              inline: 'center',
              // @ts-expect-error Chrome still supports behavior: instant but
              // it's not in the spec so TS shouts We don't want to make this
              // breaking change in Puppeteer yet so we'll ignore the line.
              behavior: 'instant',
            });
          }
        },
        this.#page.isJavaScriptEnabled()
      );
    }
  }

  async #getOOPIFOffsets(
    frame: Frame
  ): Promise<{offsetX: number; offsetY: number}> {
    let offsetX = 0;
    let offsetY = 0;
    let currentFrame: Frame | null = frame;
    while (currentFrame && currentFrame.parentFrame()) {
      const parent = currentFrame.parentFrame();
      if (!currentFrame.isOOPFrame() || !parent) {
        currentFrame = parent;
        continue;
      }
      const {backendNodeId} = await parent._client().send('DOM.getFrameOwner', {
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
    return {offsetX, offsetY};
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
    if (!result || !result.quads.length) {
      throw new Error('Node is either not clickable or not an HTMLElement');
    }
    // Filter out quads that have too small area to click into.
    // Fallback to `layoutViewport` in case of using Firefox.
    const {clientWidth, clientHeight} =
      layoutMetrics.cssLayoutViewport || layoutMetrics.layoutViewport;
    const {offsetX, offsetY} = await this.#getOOPIFOffsets(this.#frame);
    const quads = result.quads
      .map(quad => {
        return this.#fromProtocolQuad(quad);
      })
      .map(quad => {
        return applyOffsetsToQuad(quad, offsetX, offsetY);
      })
      .map(quad => {
        return this.#intersectQuadWithViewport(quad, clientWidth, clientHeight);
      })
      .filter(quad => {
        return computeQuadArea(quad) > 1;
      });
    if (!quads.length) {
      throw new Error('Node is either not clickable or not an HTMLElement');
    }
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
    return this._client.send('DOM.getBoxModel', params).catch(error => {
      return debugError(error);
    });
  }

  #fromProtocolQuad(quad: number[]): Point[] {
    return [
      {x: quad[0]!, y: quad[1]!},
      {x: quad[2]!, y: quad[3]!},
      {x: quad[4]!, y: quad[5]!},
      {x: quad[6]!, y: quad[7]!},
    ];
  }

  #intersectQuadWithViewport(
    quad: Point[],
    width: number,
    height: number
  ): Point[] {
    return quad.map(point => {
      return {
        x: Math.min(Math.max(point.x, 0), width),
        y: Math.min(Math.max(point.y, 0), height),
      };
    });
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to hover over the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async hover(this: ElementHandle<Element>): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const {x, y} = await this.clickablePoint();
    await this.#page.mouse.move(x, y);
  }

  /**
   * This method scrolls element into view if needed, and then
   * uses {@link Page.mouse} to click in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  async click(
    this: ElementHandle<Element>,
    options: ClickOptions = {}
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const {x, y} = await this.clickablePoint(options.offset);
    await this.#page.mouse.click(x, y, options);
  }

  /**
   * This method creates and captures a dragevent from the element.
   */
  async drag(
    this: ElementHandle<Element>,
    target: Point
  ): Promise<Protocol.Input.DragData> {
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
    this: ElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragEnter(target, data);
  }

  /**
   * This method creates a `dragover` event on the element.
   */
  async dragOver(
    this: ElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragOver(target, data);
  }

  /**
   * This method triggers a drop on the element.
   */
  async drop(
    this: ElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const destination = await this.clickablePoint();
    await this.#page.mouse.drop(destination, data);
  }

  /**
   * This method triggers a dragenter, dragover, and drop on the element.
   */
  async dragAndDrop(
    this: ElementHandle<Element>,
    target: ElementHandle<Node>,
    options?: {delay: number}
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
   * ```ts
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
        isString(value),
        'Values must be strings. Found value "' +
          value +
          '" of type "' +
          typeof value +
          '"'
      );
    }

    return this.evaluate((element, vals): string[] => {
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
      element.dispatchEvent(new Event('input', {bubbles: true}));
      element.dispatchEvent(new Event('change', {bubbles: true}));
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
  async uploadFile(
    this: ElementHandle<HTMLInputElement>,
    ...filePaths: string[]
  ): Promise<void> {
    const isMultiple = await this.evaluate(element => {
      return element.multiple;
    });
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
    const files = filePaths.map(filePath => {
      if (path.win32.isAbsolute(filePath) || path.posix.isAbsolute(filePath)) {
        return filePath;
      } else {
        return path.resolve(filePath);
      }
    });
    const {objectId} = this._remoteObject;
    const {node} = await this._client.send('DOM.describeNode', {objectId});
    const {backendNodeId} = node;

    /*  The zero-length array is a special case, it seems that
         DOM.setFileInputFiles does not actually update the files in that case,
         so the solution is to eval the element value to a new FileList directly.
     */
    if (files.length === 0) {
      await this.evaluate(element => {
        element.files = new DataTransfer().files;

        // Dispatch events for this case because it should behave akin to a user action.
        element.dispatchEvent(new Event('input', {bubbles: true}));
        element.dispatchEvent(new Event('change', {bubbles: true}));
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
  async tap(this: ElementHandle<Element>): Promise<void> {
    await this.#scrollIntoViewIfNeeded();
    const {x, y} = await this.clickablePoint();
    await this.#page.touchscreen.tap(x, y);
  }

  /**
   * Calls {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus | focus} on the element.
   */
  async focus(): Promise<void> {
    await this.evaluate(element => {
      if (!(element instanceof HTMLElement)) {
        throw new Error('Cannot focus non-HTMLElement');
      }
      return element.focus();
    });
  }

  /**
   * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and
   * `keyup` event for each character in the text.
   *
   * To press a special key, like `Control` or `ArrowDown`,
   * use {@link ElementHandle.press}.
   *
   * @example
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
  async type(text: string, options?: {delay: number}): Promise<void> {
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

    if (!result) {
      return null;
    }

    const {offsetX, offsetY} = await this.#getOOPIFOffsets(this.#frame);
    const quad = result.model.border;
    const x = Math.min(quad[0]!, quad[2]!, quad[4]!, quad[6]!);
    const y = Math.min(quad[1]!, quad[3]!, quad[5]!, quad[7]!);
    const width = Math.max(quad[0]!, quad[2]!, quad[4]!, quad[6]!) - x;
    const height = Math.max(quad[1]!, quad[3]!, quad[5]!, quad[7]!) - y;

    return {x: x + offsetX, y: y + offsetY, width, height};
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

    if (!result) {
      return null;
    }

    const {offsetX, offsetY} = await this.#getOOPIFOffsets(this.#frame);

    const {content, padding, border, margin, width, height} = result.model;
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
  async screenshot(
    this: ElementHandle<Element>,
    options: ScreenshotOptions = {}
  ): Promise<string | Buffer> {
    let needsViewportReset = false;

    let boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');

    const viewport = this.#page.viewport();

    if (
      viewport &&
      (boundingBox.width > viewport.width ||
        boundingBox.height > viewport.height)
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
    const {pageX, pageY} =
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

    if (needsViewportReset && viewport) {
      await this.#page.setViewport(viewport);
    }

    return imageData;
  }

  /**
   * Runs `element.querySelector` within the page.
   *
   * @param selector - The selector to query with.
   * @returns `null` if no element matches the selector.
   * @throws `Error` if the selector has no associated query handler.
   */
  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const {updatedSelector, queryHandler} =
      getQueryHandlerAndSelector(selector);
    assert(
      queryHandler.queryOne,
      'Cannot handle queries for a single element with the given selector'
    );
    return (await queryHandler.queryOne(
      this,
      updatedSelector
    )) as ElementHandle<NodeFor<Selector>> | null;
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
  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    const {updatedSelector, queryHandler} =
      getQueryHandlerAndSelector(selector);
    assert(
      queryHandler.queryAll,
      'Cannot handle queries for a multiple element with the given selector'
    );
    return (await queryHandler.queryAll(this, updatedSelector)) as Array<
      ElementHandle<NodeFor<Selector>>
    >;
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
   * ```ts
   * const tweetHandle = await page.$('.tweet');
   * expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe('100');
   * expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe('10');
   * ```
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
  ): Promise<Awaited<ReturnType<Func>>> {
    const elementHandle = await this.$(selector);
    if (!elementHandle) {
      throw new Error(
        `Error: failed to find element matching selector "${selector}"`
      );
    }
    const result = await elementHandle.evaluate(pageFunction, ...args);
    await elementHandle.dispose();
    return result;
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
   * ```ts
   * const feedHandle = await page.$('.feed');
   * expect(await feedHandle.$$eval('.tweet', nodes => nodes.map(n => n.innerText)))
   *  .toEqual(['Hello!', 'Hi!']);
   * ```
   */
  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    const {updatedSelector, queryHandler} =
      getQueryHandlerAndSelector(selector);
    assert(queryHandler.queryAllArray);
    const arrayHandle = (await queryHandler.queryAllArray(
      this,
      updatedSelector
    )) as JSHandle<Array<NodeFor<Selector>>>;
    const result = await arrayHandle.evaluate(pageFunction, ...args);
    await arrayHandle.dispose();
    return result;
  }

  /**
   * @deprecated Use {@link ElementHandle.$$} with the `xpath` prefix.
   *
   * The method evaluates the XPath expression relative to the elementHandle.
   * If there are no such elements, the method will resolve to an empty array.
   * @param expression - Expression to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate | evaluate}
   */
  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    if (expression.startsWith('//')) {
      expression = `.${expression}`;
    }
    return this.$$(`xpath/${expression}`);
  }

  /**
   * Resolves to true if the element is visible in the current viewport.
   */
  async isIntersectingViewport(
    this: ElementHandle<Element>,
    options?: {
      threshold?: number;
    }
  ): Promise<boolean> {
    const {threshold = 0} = options ?? {};
    return await this.evaluate(async (element, threshold) => {
      const visibleRatio = await new Promise<number>(resolve => {
        const observer = new IntersectionObserver(entries => {
          resolve(entries[0]!.intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
      });
      return threshold === 1 ? visibleRatio === 1 : visibleRatio > threshold;
    }, threshold);
  }
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
