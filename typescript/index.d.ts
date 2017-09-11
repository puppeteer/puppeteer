export interface LaunchOptions {
  /** @default false */
  ignoreHTTPSErrors?: boolean,

  /** @default true */
  headless?: boolean,

  /**
   * Path to a Chromium executable to run instead of bundled Chromium. If executablePath is a relative path, then it is resolved relative to current working directory
   *
   * Puppeteer works best with the version of Chromium it is bundled with.
   * There is no guarantee it will work with any other version.
   * Use `executablePath` option with extreme caution.
   * If Google Chrome (rather than Chromium) is preferred,
   *  - a [Chrome Canary](https://www.google.com/chrome/browser/canary.html)
   *  - or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested.
   */
  executablePath?: string,

  /** Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on. */
  slowMo?: number,

  /** Additional arguments to pass to the Chromium instance. List of Chromium flags can be found [here](http://peter.sh/experiments/chromium-command-line-switches/) */
  args?: string[],

  /** Close chrome process on Ctrl-C. Defaults to `true`. */
  handleSIGINT?: boolean,

  /** Maximum time in milliseconds to wait for the Chrome instance to start. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. */
  timeout?: number,

  /** Whether to pipe browser process stdout and stderr into `process.stdout` and `process.stderr`. Defaults to `false`. */
  dumpio?: boolean,

  /** Path to a [User Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md) */
  userDataDir?: string,
}

/**
 * The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.
 */
export function launch(options?: LaunchOptions): Promise<Browser>;

/**
 * A Browser is created when Puppeteer connects to a Chromium instance,
 * either through `launch`
 * or `connect`
 */
export class Browser {
  /** Closes browser with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore. */
  close(): void
  /**
   * Creates a new page
   */
  newPage(): Promise<Page>
  /**
   * For headless Chromium, this is similar to `HeadlessChrome/61.0.3153.0`.
   * For non-headless, this is similar to `Chrome/61.0.3153.0`.
   *
   * NOTE: the format of browser.version() might change with future releases of Chromium.
   */
  version(): string

  /**
   * Browser websocket url.
   * It could be used as an argument to `connect`
   */
  wsEndpoint(): string
}

export type NavigationOptions = {
  /** Maximum navigation time in milliseconds, defaults to 30 seconds. */
  timeout?: number
  /** When to consider a navigation finished, defaults to `load`. */
  waitUntil?:
  /** consider navigation to be finished when the `load` event is fired. */
  | 'load'
  /** consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms. */
  | 'networkidle'
  /** Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter. */
  networkIdleInflight?: number
  /** A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter. */
  networkIdleTimeout?: number
}

export type ViewportOptions = {
  /** page width in pixels */
  width?: number
  /** page height in pixels */
  height?: number
  /** Specify device scale factor (could be thought of as dpr). Defaults to `1`. */
  deviceScaleFactor?: number
  /** Whether the `meta viewport` tag is taken into account. Defaults to `false`. */
  isMobile?: boolean,
  /** Specifies if viewport supports touch events. Defaults to `false` */
  hasTouch?: boolean,
  /** Specifies if viewport is in landscape mode. Defaults to `false`. */
  isLandscape?: boolean,
}

export type ClickOptions = {
  button?: /** default */'left' | 'right' | 'middle',
  /** defaults to 1 */
  clickCount?: number,
  /** Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0. */
  delay?: number,
}

/**
 * Page provides methods to interact with a single tab in Chromium.
 * One `Browser` instance might have multiple `Page` instances.
 */
export class Page {
  /**
   * Emitted when JavaScript within the page calls one of console API methods,
   * e.g. `console.log` or `console.dir`.
   * Also emitted if the page throws an error or a warning.
   * The arguments passed into `console.log` appear as arguments on the event handler.
   */
  on(event: 'console', cb: (...args: any[]) => any): void
  /**
   * Emitted when a JavaScript dialog appears, such as `alert`, `prompt`, `confirm` or `beforeunload`.
   * You can respond to the dialog via [Dialog]'s [accept](#dialogacceptprompttext) or [dismiss](#dialogdismiss) methods
   */
  on(event: 'dialog', cb: (dialog: Dialog) => any): void
  /**
   * Emitted when the page crashes.
   * **NOTE** `error` event has a special meaning in Node, see [error events](https://nodejs.org/api/events.html#events_error_events) for details.
   */
  on(event: 'error', cb: (e: Error) => any): void
  /**
   * Emitted when a frame is attached.
   */
  on(event: 'frameattached', cb: (e: Frame) => any): void
  /**
   * Emitted when a frame is detached.
   */
  on(event: 'framedetached', cb: (e: Frame) => any): void
  /**
   * Emitted when a frame is navigated to a new url.
   */
  on(event: 'framenavigated', cb: (e: Frame) => any): void
  /**
   * Emitted when the JavaScript [`load`](https://developer.mozilla.org/en-US/docs/Web/Events/load) event is dispatched.
   */
  on(event: 'load', cb: () => any): void
  /**
   * Emitted when an uncaught exception happens within the page.
   */
  on(event: 'pageerror', cb: (errorMessage: string) => any): void
  /**
   * Emitted when a page issues a request.
   * The [request] object is read-only.
   * In order to intercept and mutate requests, see `page.setRequestInterceptionEnabled`.
   */
  on(event: 'request', cb: (req: Request) => any): void
  /**
   * Emitted when a request fails, for example by timing out.
   */
  on(event: 'requestfailed', cb: (req: Request) => any): void
  /**
   * Emitted when a request finishes successfully.
   */
  on(event: 'requestfinished', cb: (req: Request) => any): void
  /**
   * Emitted when a [response] is received.
   */
  on(event: 'response', cb: (req: Response) => any): void

  /**
   * The method runs `document.querySelector` within the page. If no element matches the selector, the return value resolve to `null`.
   */
  $(selector: string): Promise<ElementHandle | null>

  /**
   * The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolve to `[]`.
   */
  $$(selector: string): Promise<ElementHandle[]>

  /**
   * This method runs `document.querySelector` within the page and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error
   */
  $eval<T>(selector: string, pageFunction: (e: Node) => T, ...args: any[]): Promise<T>

  /**
   * Adds a `<script>` tag into the page with the desired url.
   * @returns resolves when the scripts `onload` fires.
   * Alternatively, a local JavaScript file could be injected via [`page.injectFile`](#pageinjectfilefilepath) method.
   */
  addScriptTag(url: string): Promise<void>

  /**
   * This method fetches an element with `selector`,
   * scrolls it into view if needed,
   * and then uses `page.mouse` to click in the center of the element.
   * If there's no element matching `selector`, the method throws an error.
   */
  click(selector: string, options?: ClickOptions): Promise<void>

  close(): Promise<void>

  /** Gets the full HTML contents of the page, including the doctype. */
  content(): Promise<string>

  /**
   *
   * @param urls If no URLs are specified, this method returns cookies for the current page URL.
If URLs are specified, only cookies for those URLs are returned.
   */
  cookies(...urls: string[]): Promise<{
    name: string,
    value: string,
    domain: string,
    path: string,
    expires: number,
    httpOnly: boolean,
    secure: boolean,
    sameSite: 'Strict' | 'Lax'
  }[]>

  deleteCookie(...cookies: {
    name: string,
    url?: string,
    domain?: string,
    path?: string,
    secure?: boolean,
  }[]): Promise<void>

  /**
   * Emulates given device metrics and user agent.
   * This method is a shortcut for calling two methods:
   * - setViewport
   * - setUserAgent
   **/
  emulate(options: {
    viewport?: ViewportOptions,
    userAgent?: string
  }): Promise<void>

  /**
   * Changes the CSS media type of the page.
   * Passing `null` disables media emulation.
   */
  emulateMedia(mediaType: 'screen' | 'print' | null): Promise<void>

  /**
   * Function to be evaluated in the page context
   */
  evaluate<T>(pageFunction: () => T, ...args: any[]): T
  evaluate(str: string, ...args: any[]): any

  evaluateOnNewDocument(pageFunction: () => any, ...args: any[]): Promise<void>;

  /**
   * The method adds a function called `name` on the page's `window` object.
   * When called, the function executes `puppeteerFunction` in node.js and returns a [Promise] which resolves to the return value of `puppeteerFunction`.
   */
  exposeFunction(name: string, puppeteerFunction: () => any): Promise<void>;

  /**
   * A [selector] of an element to focus.
   * If there are multiple elements satisfying the selector, the first will be focused.
   * If there's no element matching `selector`, the method throws an error.
   */
  focus(selector: string): Promise<void>;

  /** An array of all frames attached to the page */
  frames(): Frame[];

  /**
   * Navigate to the previous page in history.
   *
   * @returns Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go back, resolves to null.
   */
  goBack(options?: NavigationOptions): Promise<Response | null>;
  /**
   * Navigate to the next page in history.
   *
   * @returns Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go forward, resolves to null.
   */
  goForward(options?: NavigationOptions): Promise<Response | null>;

  /**
   * `goto` will throw an error if:
   * - there's an SSL error (e.g. in case of self-signed certificates).
   * - target URL is invalid.
   * - the `timeout` is exceeded during navigation.
   * - the main resource failed to load.
   *
   * @returns Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.
   */
  goto(url: string, options?: NavigationOptions): Promise<Response>

  /**
   * This method fetches an element with `selector`, scrolls it into view if needed, and then uses [page.mouse](#pagemouse) to hover over the center of the element.
If there's no element matching `selector`, the method throws an error.
   * @param selector to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered.
   * @returns Promise which resolves when the element matching `selector` is successfully hovered. Promise gets rejected if there's no element matching `selector`.
   */
  hover(selector: string): Promise<void>

  /**
   * @param filePath Path to the JavaScript file to be injected into frame. If `filePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd)
   * @returns Promise which resolves when file gets successfully evaluated in frame.
   */
  injectFile(filePath: string): Promise<void>

  keyboard: Keyboard

  /** Page is guaranteed to have a main frame which persists during navigations. */
  mainFrame(): Frame

  mouse: Mouse

  /**
   * **NOTE** Generating a pdf is currently only supported in Chrome headless.
   *
   * `page.pdf()` generates a pdf of the page with `print` css media. To generate a pdf with `screen` media, call [page.emulateMedia('screen')](#pageemulatemediamediatype) before calling `page.pdf()`
   *
   */
  pdf(options?: {
    /** The file path to save the PDF to. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd). If no path is provided, the PDF won't be saved to the disk. */
    path?: string,
    /**  Scale of the webpage rendering. Defaults to `1`. */
    scale?: number,
    /**  Display header and footer. Defaults to `false`. */
    displayHeaderFooter?: boolean,
    /**
     * Print background graphics. Defaults to `false`.
     **/
    printBackground?: boolean,
    /**
     * Paper orientation. Defaults to `false`.
     **/
    landscape?: boolean,
    /**
     * Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
     **/
    pageRanges?: string,
    /**
     * Paper format.
     * If set, takes priority over`width` or`height` options.
     * Defaults to 'Letter'. */
    format?:
    | 'Letter'
    | 'Legal'
    | 'Tabloid'
    | 'Ledger'
    | 'A0'
    | 'A1'
    | 'A2'
    | 'A3'
    | 'A4'
    | 'A5'
    /** Paper width, accepts values labeled with units. */
    width?: string,
    /** Paper height, accepts values labeled with units. */
    height?: string,
    /**
     * Paper margins, defaults to none.
     * For each sub prop example values:
     *  100
     *  '100px'
     *  '100in'
     *  '100cm'
     *  '100mm'
     */
    margin?: {
      /** Top margin, accepts values labeled with units. */
      top?: number | string,
      /** Right margin, accepts values labeled with units. */
      right?: number | string,
      /** Bottom margin, accepts values labeled with units. */
      bottom?: number | string,
      /** Left margin, accepts values labeled with units. */
      left?: number | string,
    }
  }): Promise<Buffer>

  /**
   * Returns page's inner text.
   */
  plainText(): Promise<string>

  /**
   * Shortcut for `keyboard.down` and `keyboard.up`
   * @param key Name of key to press, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
   */
  press(
    key: string,
    options?: {
      /** If specified, generates an input event with this text. */
      text?: string,
      /** Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0. */
      delay?: number
    }
  ): Promise<void>

  /**
   * @returns Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.
   */
  reload(options?: NavigationOptions): Promise<Response>

  /**
   * @returns Promise which resolves to buffer with captured screenshot
   */
  screenshot(options?: {
    /** The file path to save the image to. The screenshot type will be inferred from file extension. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd). If no path is provided, the image won't be saved to the disk. */
    path?: string,
    /** Specify screenshot type, could be either `jpeg` or `png`. Defaults to 'png'. */
    type?: 'png' | 'jpeg',
    /**  The quality of the image, between 0 - 100. Not applicable to `png` images. */
    quality?: number,
    /** When true, takes a screenshot of the full scrollable page. Defaults to `false` */
    fullPage?: boolean,
    /** An object which specifies clipping region of the page. */
    clip?: {
      /** x-coordinate of top-left corner of clip area */
      x?: number
      /** y-coordinate of top-left corner of clip area */
      y?: number
      /** width of clipping area */
      width?: number
      /** height of clipping area} */
      height?: number
    },
    /** Hides default white background and allows capturing screenshots with transparency. Defaults to `false`. */
    omitBackground?: boolean
  }): Promise<Buffer>

  setContent(html: string): Promise<void>

  setCookie(cookies: {
    name: string,
    value: string,
    url?: string,
    domain?: string,
    path?: string
    /** Unix time in seconds. */
    expires?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: "Strict" | "Lax"
  }[]): Promise<void>

  /** The extra HTTP headers will be sent with every request the page initiates. */
  setExtraHTTPHeaders(headers: any): Promise<void>

  /**
   * Whether or not to enable JavaScript on the page.
   *
   * **NOTE** changing this value won't affect scripts that have already been run. It will take full effect on the next [navigation](#pagegotourl-options).
   */
  setJavaScriptEnabled(enabled: boolean): Promise<void>

  /**
   * Activating request interception enables `request.abort` and `request.continue`.
   */
  setRequestInterceptionEnabled(value: boolean): Promise<void>

  /** Sets a specific user agent to use in this page */
  setUserAgent(userAgent: string): Promise<void>

  /**
   * - in certain cases, setting viewport will reload the page in order to set the `isMobile` or `hasTouch` properties.
   * - in the case of multiple pages in a single browser, each page can have its own viewport size.
   */
  setViewport(viewport: ViewportOptions): Promise<void>

  /**
   * This method fetches an element with `selector`, scrolls it into view if needed, and then uses `touchscreen` to tap in the center of the element.
   *
   * If there's no element matching `selector`, the method throws an error.
   *
   * @param selector A selector to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped.
   */
  tap(selector: string): Promise<void>

  /**
   * Returns page's title.
   * Shortcut for [page.mainFrame().title()](#frametitle).
   */
  title(): Promise<string>

  touchscreen: Touchscreen

  tracing: Tracing

  /**
   * Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text into the focused element.
   * To press a special key, use `press`
   */
  type(text: string, options?: {
    delay: number
  }): Promise<void>

  url(): string

  viewport(): ViewportOptions

  /**
   * Prefer specific waitFor functions
   *  - waitForFunction
   *  - waitForSelector
   *  - waitForTimeout
   **/
  waitFor: any

  /**
   * @param pageFunction Function to be evaluated in browser context
   */
  waitForFunction(
    pageFunction: (...args: any[]) => boolean | string,
    options?: {
      /**
       * An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed.
       */
      polling?:
      /** to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes. */
      | 'raf'
      /** to execute `pageFunction` on every DOM mutation. */
      | 'mutation'
      | number

      /** maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). */
      timeout?: number
    },
    /** Arguments to pass to  `pageFunction` */
    ...args: any[]
  ): Promise<void>

  /**
   * @returns Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.
   */
  waitForNavigation(options: NavigationOptions): Promise<Response>

  /**
   * Wait for the `selector` to appear in page.
   * If at the moment of calling the method the `selector` already exists, the method will return immediately.
   * If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.
   */
  waitForSelector(
    selector: string,
    options?: {
      /** wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`. */
      visible?: boolean
      /** maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). */
      timeout?: number
    }
  ): Promise<void>
}

/**
 * Keyboard provides an api for managing a virtual keyboard.
 *
 * The high level api is `page.type`, which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.
 *
 * For finer control, you can use `keyboard.down`, `keyboard.up`, and `keyboard.sendCharacter` to manually fire events as if they were generated from a real keyboard.
 */
export class Keyboard {
  /**
   * Dispatches a `keydown` event.
   *
   * If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`, subsequent key presses will be sent with that modifier active. To release the modifier key, use `up`.
   *
   * After the key is pressed once, subsequent calls to `down` will have [repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) set to true. To release the key, use `up`.
   */
  down(
    /** Name of key to press, such as `ArrowLeft`.See[KeyboardEvent.key](https://www.w3.org/TR/uievents-key/) */
    key: string,
    options?: {
      /** If specified, generates an input event with this text. */
      text: string,
    }): Promise<void>

  /**
   * Dispatches a `keypress` and `input` event.
   * This does not send a `keydown` or `keyup` event.
   *
   * @param char Character to send into the page
   *
   * e.g
   * ```
   * page.keyboard.sendCharacter('嗨');
   * ```
   */
  sendCharacter(char: string): Promise<void>

  /**
   * Dispatches a `keyup` event.
   *
   * @param key Name of key to release, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
   */
  up(
    key: string
  ): Promise<void>
}

export class Mouse {
  /**
   * Shortcut for `move`, `down` and `up`
   */
  click(x: number, y: number, options?: ClickOptions): Promise<void>

  /**
   * Dispatches a `mousedown` event.
   */
  down(options?: {
    button?: /** default */ 'left' | 'right' | 'middle'
    /** defaults to 1 */
    clickCount?: number
  }): Promise<void>

  /**
   * Dispatches a `mousemove` event.
   */
  move(x: number, y: number, options?: {
    /** defaults to 1. Sends intermediate `mousemove` events. */
    steps: number
  }): Promise<void>

  /**
   * Dispatches a `mouseup` event.
   */
  up(options?: {
    button?: /** default */ 'left' | 'right' | 'middle'
    /** defaults to 1 */
    clickCount?: number
  }): Promise<void>
}

export class Touchscreen {
  /** Dispatches a touchstart and touchend event. */
  tap(x: number, y: number): Promise<void>
}

/**
 * You can use tracing.start and tracing.stop to create a trace file which can be opened in Chrome DevTools or timeline viewer.
 */
export class Tracing {
  /** Only one trace can be active at a time per browser. */
  start(options: {
    /** A path to write the trace file to  */
    path: string
    /** captures screenshots in the trace. */
    screenshots?: boolean
  }): Promise<void>;

  stop(): Promise<void>;
}

/**
 * Dialog objects are dispatched by page via the 'dialog' event.
 *
 * e.g.
 *
 * ```js
const puppeteer = require('puppeteer');
puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.dismiss();
    browser.close();
  });
  page.evaluate(() => alert('1'));
});
 * ```
 */
export class Dialog {
  type: 'alert' | 'beforeunload' | 'confirm' | 'prompt'

  /**
   * A text to enter in prompt.
   * Does not cause any effects if the dialog's `type` is not prompt.
   */
  accept(promptText?: string): Promise<void>

  /**
   * If dialog is prompt, returns default prompt value.
   * Otherwise, returns empty string.
   */
  defaultValue(): string

  /**
   * Dismisses the dialog
   */
  dismiss(): Promise<void>

  /**
   * A message displayed in the dialog.
   */
  message(): string
}

/**
 * At every point of time, page exposes its current frame tree via
 * the `page.mainFrame()` and `frame.childFrames()` methods
 *
 * Frame object's lifecycle is controlled by three events, dispatched on the page object.
 * frameattached | framenavigated | framedetached
 *
 * Example frametree dumping:
```js
const page = await browser.newPage();
  await page.goto('https://www.google.com/chrome/browser/canary.html');
  dumpFrameTree(page.mainFrame(), '');
  browser.close();

  function dumpFrameTree(frame, indent) {
    console.log(indent + frame.url());
    for (let child of frame.childFrames())
      dumpFrameTree(child, indent + '  ');
  }
```
 */
export class Frame {
  /**
   * The method queries frame for the selector. If there's no such element within the frame, the method will resolve to `null`.
   */
  $(selector: string): Promise<ElementHandle | null>

  /**
   * The method runs `document.querySelectorAll` within the frame. If no elements match the selector, the return value resolve to `[]`.
   */
  $$(selector: string): Promise<ElementHandle[]>

  /**
   * This method runs `document.querySelector` within the frame and passes it as the first argument to `pageFunction`. If there's no element matching `selector`, the method throws an error.

If `pageFunction` returns a [Promise], then `frame.$eval` would wait for the promise to resolve and return it's value.

e.g
```js
const html = await frame.$eval('.main-container', e => e.outerHTML);
```
   */
  $eval<T>(selector: string, pageFunction: (el: Node) => T, ...args: any[]): Promise<T>

  /**
   * Adds a `<script>` tag to the frame with the desired url.
   * Alternatively, JavaScript could be injected to the frame via `injectFile` method.
   */
  addScriptTag(url: string): Promise<void>

  /** Helps get the frame tree */
  childFrames(): Frame[];

  /**
   * If the function, passed to the `page.evaluate`, returns a Promise,
   * then `page.evaluate` would wait for the promise to resolve and return it's value.
   *
   * @param pageFunction Function to be evaluated in browser context
   * @returns Promise which resolves to function return value.
   */
  evaluate<T>(pageFunction: () => T): Promise<T>
  evaluate(code: string): Promise<any>

  /**
   * @param filePath Path to the JavaScript file to be injected into frame.
   * If `filePath` is a relative path, then it is resolved relative to cwd.
   */
  injectFile(filePath: string): Promise<void>

  /**
   * Returns `true` if the frame has been detached, or `false` otherwise.
   */
  isDetached(): boolean

  /**
   * Returns frame's name attribute as specified in the tag.
   * If the name is empty, returns the id attribute instead.
   *
   * This value is calculated once when the frame is created,
   *  and will not update if the attribute is changed later.
   */
  name(): string

  /**
   * Returns parent frame, if any. Detached frames and main frames return `null`
   */
  parentFrame(): Frame | null

  /**
   * Returns page's title.
   */
  title(): string

  /**
   * Returns frame's url.
   */
  url(): string

  /**
   * Prefer specific waitFor functions
   *  - waitForFunction
   *  - waitForSelector
   **/
  waitFor: any

  /**
   * @param pageFunction Function to be evaluated in browser context
   */
  waitForFunction(
    pageFunction: (...args: any[]) => boolean | string,
    options?: {
      /**
       * An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed.
       */
      polling?:
      /** to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes. */
      | 'raf'
      /** to execute `pageFunction` on every DOM mutation. */
      | 'mutation'
      | number

      /** maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). */
      timeout?: number
    },
    /** Arguments to pass to  `pageFunction` */
    ...args: any[]
  ): Promise<void>

  /**
   * Wait for the `selector` to appear in page.
   * If at the moment of calling the method the `selector` already exists, the method will return immediately.
   * If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.
   */
  waitForSelector(
    selector: string,
    options?: {
      /** wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`. */
      visible?: boolean
      /** maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). */
      timeout?: number
    }
  ): Promise<void>
}

/**
 * ElementHandle represents an in-page DOM element.
 * ElementHandles could be created with the `page.$` method.
 *
```js
const inputElement = await page.$('input[type=submit]');
await inputElement.click();
```
 * - ElementHandle prevents DOM element from garbage collection unless you call `dispose`
 * - ElementHandles are always auto-disposed when their origin frame gets navigated.
 */
export class ElementHandle {
  /**
   * This method scrolls element into view if needed,
   * and then uses `page.mouse` to click in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  click(options?: ClickOptions): Promise<void>

  /**
   * The method stops referencing the element handle opening it up for garbage collection
   */
  dispose(): Promise<void>

  /**
   * @param pageFunction Function to be evaluated in browser context
   */
  evaluate<T>(pageFunction: (e: Node) => T, ...args: any[]): Promise<T>

  /**
   * This method scrolls element into view if needed,
   * and then uses `page.mouse` to hover over the center of the element.
   * If the element is detached from DOM, the method throws an error.
   *
   * @returns Promise which resolves when the element is successfully hovered.
   */
  hover(): Promise<void>

  /**
   * This method scrolls element into view if needed,
   * and then uses `touchscreen.tap` to tap in the center of the element.
   * If the element is detached from DOM, the method throws an error.
   */
  tap(): Promise<void>

  /**
   * This method expects `elementHandle` to point to an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).
   *
   * @param filePaths Sets the value of the file input these paths. If some of the  `filePaths` are relative paths, then they are resolved relative to cwd.
   */
  uploadFile(...filePaths: string[]): Promise<void>
}

/**
 * Whenever the page sends a request, the following events are emitted by the page
 *
 * 'request' emitted when the request is issued by the page.
 * 'response' emitted when/if the response is received for the request.
 * 'requestfinished' emitted when the response body is downloaded and the request is complete.
 *
 * If request fails at some point,
 *  then instead of 'requestfinished' event (and possibly instead of 'response' event),
 *  the ['requestfailed'](#event-requestfailed) event is emitted.
 *
 * If request gets a 'redirect' response,
 *  the request is successfully finished with the 'requestfinished' event,
 *  and a new request is issued to a redirected url.
 */
export class Request {
  /**
   * To use this,
   *  request interception should be enabled with `page.setRequestInterceptionEnabled`.
   * Exception is immediately thrown if the request interception is not enabled.
   *
   * Aborts request.
   */
  abort(): void

  /**
   * To use this,
   *  request interception should be enabled with `page.setRequestInterceptionEnabled`.
   * Exception is immediately thrown if the request interception is not enabled.
   *
   * Continues request with optional request overrides.
   *
   * @param overrides Optional request overwrites
   */
  continue(overrides?: {
    /** If set, the request url will be changed */
    url?: string,
    /** If set changes the request method */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    /** If set changes the post data of request */
    postData?: string,
    /** If set changes the request HTTP headers */
    header?: any,
  }): void

  /**
   * An object with HTTP headers associated with the request. All header names are lower-case.
   */
  headers: any

  /** Contains the request's method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'

  /** Contains the request's post body, if any. */
  postData?: string

  /**
   * Contains the request's resource type as it was perceived by the rendering engine.
   */
  resourceType: 'Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'Other'

  /**
   * A matching [Response] object, or `null` if the response has not been received yet.
   */
  response(): Response | null

  /**
   * Contains the URL of the request.
   */
  url: string
}

/**
 * Response class represents responses which are received by page.
 */
export class Response {
  /**
   * resolves to a buffer with response body.
   */
  buffer(): Promise<Buffer>

  /**
   * An object with HTTP headers associated with the response. All header names are lower-case.
   */
  headers: any

  /**
   * Promise which resolves to a JSON representation of response body.
   * This method will throw if the response body is not parsable via `JSON.parse`.
   */
  json(): Promise<any>

  /**
   * Contains a boolean stating whether the response was successful (status in the range 200-299) or not.
   */
  ok: boolean

  /**
   * @returns A matching Request object.
   */
  request(): Request

  /**
   * Contains the status code of the response (e.g., 200 for a success).
   */
  status: number

  /**
   * @returns Promise which resolves to a text representation of response body.
   */
  text(): Promise<string>

  /**
   * Contains the URL of the response.
   */
  url: string
}
