export interface ConnectOptions {
  browserWSEndpoint?: string
  // a browser websocket endpoint to connect to
  ignoreHTTPSErrors?: boolean
  // Whether to ignore HTTPS errors during navigation. Defaults to `false`
}

export interface LaunchOptions {
  ignoreHTTPSErrors?: boolean
  // Whether to ignore HTTPS errors during navigation. Defaults to false
  headless?: boolean
  // Whether to run Chromium in headless mode. Defaults to true.
  executablePath?: string
  // Path to a Chromium executable to run instead of bundled Chromium. If executablePath is a relative path, then it is resolved relative to current working directory.
  slowMo?: number
  // Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on.
  args?: Array<string>
  // Additional arguments to pass to the Chromium instance. List of Chromium flags can be found here.
  dumpio?: boolean
  // Whether to pipe browser process stdout and stderr into process.stdout and process.stderr. Defaults to false.
}

export interface ViewPort {
  width: number
  height: number
  deviceScaleFactor?: number
  isMobile?: boolean
  hasTouch?: boolean
  isLandscape?: boolean
}

export type GoBackOptions = {
  timeout?: number
} | {
  timeout?: number
  waitUntil: 'load'
} | {
  timeout?: number
  waitUntil: 'networkidle'
  networkIdleInflight?: number
}

export type GoForwardOptions = {
  timeout?: number
} | {
  timeout?: number
  waitUntil: 'load'
} | {
  timeout?: number
  waitUntil: 'networkidle'
  networkIdleInflight?: number
}

export type GotoOptions = GoForwardOptions
export type ReloadOptions = GoForwardOptions

export interface PDFOptions {
  /**
   * The file path to save the image to.
   * The screenshot type will be inferred from file extension.
   * If path is a relative path, then it is resolved relative to current working directory.
   * If no path is provided, the image won't be saved to the disk
   */
  path?: string
  /**
   * default 1
   */
  scale?: number
  /**
   * default false
   */
  displayHeaderFooter?: boolean
  /**
   * default false
   */
  printBackground?: boolean
  /**
   * default false
   */
  landscape?: boolean
  /**
   * 1-5,8,11-13
   */
  pageRanges?: string
  format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' // default Letter
  width?: string | number
  height?: string | number
  margin?: {
    top: string | number
    right: string | number
    bottom: string | number
    left: string | number
  }
}

export interface ScreenShotOptions {
  /**
   * The file path to save the image to.
   * The screenshot type will be inferred from file extension.
   * If path is a relative path, then it is resolved relative to current working directory.
   * If no path is provided, the image won't be saved to the disk
   */
  path?: string
  /**
   * Specify screenshot type, could be either jpeg or png.
   * Defaults to 'png'
   */
  type?: 'jpeg' | 'png'
  /**
   * The quality of the image, between 0-100.
   * Not applicable to png images.
   */
  quality?: number
  /**
   * When true, takes a screenshot of the full scrollable page. Defaults to false
   */
  fullPage?: boolean
  /**
   * An object which specifies clipping region of the page.
   * Should have the following fields:
   *  - x <number> x-coordinate of top-left corner of clip area
   *  - y <number> y-coordinate of top-left corner of clip area
   *  - width <number> width of clipping area
   *  - height <number> height of clipping area
   */
  clip?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
}

export interface Browser {
  close: void
  // Closes browser with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.
  newPage(): Promise<Page>
  version(): Promise<string>
  wsEndpoint(): string
}

export interface Page {
  on(event: 'console', callback: (...args: string[]) => any): void
  on(event: 'dialog', callback: (dialog: Dialog) => any): void
  on(event: 'error', callback: (err: Error) => any): void
  on(event: 'frameattached', callback: (frame: Frame) => any): void
  on(event: 'framedetached', callback: (frame: Frame) => any): void
  on(event: 'framenavigated', callback: (frame: Frame) => any): void
  on(event: 'load', callback: () => any): void
  on(event: 'pageerror', callback: (msg: string) => any): void
  on(event: 'request', callback: (request: Request) => any): void
  on(event: 'requestfailed', callback: (request: Request) => any): void
  on(event: 'requestfinished', callback: (request: Request) => any): void
  on(event: 'response', callback: (request: Response) => any): void
  $(selector: string): Promise<ElementHandler>
  addScriptTag(url: string): Promise<void>
  click(selector: string, options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
    delay?: number
  }): Promise<void>
  close(): Promise<void>
  emulate(options: {
    viewport: ViewPort
    userAgent: string
  }): Promise<void>
  evaluate<T>(pageFunction: ((...args: any[]) => T) | string, ...args: any[]): Promise<T>
  evaluateOnNewDocument<T>(pageFunction: ((...args: any[]) => T) | string, ...args: any[]): Promise<T>
  exposeFunction(name: string, puppeteerFunction: Function): void
  focus(selector: string): Promise<void>
  frames(): Promise<Frame[]>
  goBack(options?: GoBackOptions): Promise<Response>
  goForward(options?: GoForwardOptions): Promise<Response>
  goto(url: string, options?: GotoOptions): Promise<Response>
  hover(selector: string): Promise<void>
  injectFile(filePath: string): Promise<void>
  keyboard: Keyboard
  mainFrame(): Frame
  mouse: Mouse
  /**
   * ### All possible units are:
   *   - px - pixel
   *   - in - inch
   *   - cm - centimeter
   *   - mm - millimeter
   *
   * ### The format options are:
   *   - Letter: 8.5in x 11in
   *   - Legal: 8.5in x 14in
   *   - Tabloid: 11in x 17in
   *   - Ledger: 17in x 11in
   *   - A0: 33.1in x 46.8in
   *   - A1: 23.4in x 33.1in
   *   - A2: 16.5in x 23.4in
   *   - A3: 11.7in x 16.5in
   *   - A4: 8.27in x 11.7in
   *   - A5: 5.83in x 8.27in
   */
  pdf(options?: PDFOptions): Promise<Buffer>
  plainText(): Promise<string>
  press(key: string, options?: {
    text?: string
    delay?: number
  }): Promise<void>
  reload(options: ReloadOptions): Promise<Response>
  screenshot(options?: ScreenShotOptions): Promise<Buffer>
  setContent(html: string): Promise<void>
  setExtraHTTPHeaders(headers: any): Promise<void>
  setRequestInterceptionEnabled(enabled: boolean): Promise<void>
  setUserAgent(userAgent: string): Promise<void>
  setViewport(viewPort: ViewPort): Promise<void>
  title(): Promise<string>
  tracing: Tracing
  type(text: string, options?: {
    /**
     * Time to wait between key presses in milliseconds. Defaults to 0.
     */
    delay: number
  }): Promise<void>
  /**
   * @param selector A selector to a file input
   * @param filePaths Sets the value of the file input these paths. If some of the filePaths are relative paths, then they are resolved relative to current working directory.
   */
  uploadFile(selector: string, ...filePaths: string[]): Promise<void>
  url(): string
  viewport(): ViewPort
  /**
   * @param selectorOrFunctionOrTimeout A selector of an element to wait for
   * @param options Optional waiting parameters
   *  - visible <boolean> wait for element to be present in DOM and to be visible, i.e. to not have display: none or visibility: hidden CSS properties. Defaults to false.
   *  - timeout <number> maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
   */
  waitFor(selectorOrFunctionOrTimeout: string, options?: {
    visible?: boolean
    timeout?: number
  }): Promise<void>
  waitFor(selectorOrFunctionOrTimeout: Function, options?: {
    /**
     * polling <string|number> An interval at which the pageFunction is executed, defaults to raf.
     * If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it could be one of the following values:
     *   - raf - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
     *   - mutation - to execute pageFunction on every DOM mutation.
     */
    polling?: 'raf' | 'mutation' | number
    /**
     * maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
     */
    timeout?: number
  }): Promise<void>
  /**
   * if selectorOrFunctionOrTimeout is a number, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
   */
  waitFor(selectorOrFunctionOrTimeout: number): Promise<void>
  waitForFunction(func: string | Function, options?: {
    /**
     * polling <string|number> An interval at which the pageFunction is executed, defaults to raf.
     * If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it could be one of the following values:
     *   - raf - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
     *   - mutation - to execute pageFunction on every DOM mutation.
     */
    polling?: 'raf' | 'mutation' | number
    /**
     * maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
     */
    timeout?: number
  }, ...args: any[]): Promise<void>
  waitForNavigation(options: {
    timeout?: number
    waitUntil?: 'load' | 'networkidle'
    networkIdleInflight?: number
    networkIdleTimeout?: number
  }): Promise<Response>
  waitForSelector(selector: string, options?: {
    visible?: boolean
    timeout?: number
  }): Promise<void>
}

export interface Dialog {
  accept(promptText: string): Promise<void>
  defaultValue(): string
  dismiss(): Promise<void>
  message(): string
  type: 'alert' | 'beforeunload' | 'confirm' | 'prompt'
}

/**
 * At every point of time, page exposes its current frame tree via the page.mainFrame() and frame.childFrames() methods.
 * Frame object's lifecycle is controlled by three events, dispatched on the page object:
 *  - 'frameattached' - fired when the frame gets attached to the page. Frame could be attached to the page only once.
 *  - 'framenavigated' - fired when the frame commits navigation to a different URL.
 *  - 'framedetached' - fired when the frame gets detached from the page. Frame could be detached from the page only once.
 */
export interface Frame {
  $(selector: string): Promise<ElementHandler>
  addScriptTag(url: string): Promise<void>
  childFrames(): Frame[]
  evaluate(pageFunction: string, ...args: any[]): Promise<any>
  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T>
  injectFile(filePath: string): Promise<void>
  isDetached(): boolean
  name(): string
  parentFrame(): Frame
  title(): Promise<string>
  /**
   * @param selector A selector to a file input
   * @param filePaths Sets the value of the file input these paths.
   * If some of the filePaths are relative paths, then they are resolved relative to current working directory.
   */
  uploadFile(selector: string, ...filePaths: string[]): Promise<void>
  url(): string
  /**
   * @param selectorOrFunctionOrTimeout A selector of an element to wait for
   * @param options Optional waiting parameters
   *  - visible <boolean> wait for element to be present in DOM and to be visible, i.e. to not have display: none or visibility: hidden CSS properties. Defaults to false.
   *  - timeout <number> maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
   */
  waitFor(selectorOrFunctionOrTimeout: string, options?: {
    visible?: boolean
    timeout?: number
  }): Promise<void>
  waitFor(selectorOrFunctionOrTimeout: Function, options?: {
    /**
     * polling <string|number> An interval at which the pageFunction is executed, defaults to raf.
     * If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it could be one of the following values:
     *   - raf - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
     *   - mutation - to execute pageFunction on every DOM mutation.
     */
    polling?: 'raf' | 'mutation' | number
    /**
     * maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
     */
    timeout?: number
  }): Promise<void>
  /**
   * if selectorOrFunctionOrTimeout is a number, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
   */
  waitFor(selectorOrFunctionOrTimeout: number): Promise<void>
  waitForFunction(func: string | Function, options?: {
    /**
     * polling <string|number> An interval at which the pageFunction is executed, defaults to raf.
     * If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it could be one of the following values:
     *   - raf - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
     *   - mutation - to execute pageFunction on every DOM mutation.
     */
    polling?: 'raf' | 'mutation' | number
    /**
     * maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
     */
    timeout?: number
  }, ...args: any[]): Promise<void>
  /**
   * Wait for the selector to appear in page.
   * If at the moment of calling the method the selector already exists, the method will return immediately.
   * If the selector doesn't appear after the timeout milliseconds of waiting, the function will throw.
   */
  waitForSelector(selector: string, options?: {
    visible?: boolean
    timeout?: number
  }): Promise<void>
}

/**
 * Whenever the page sends a request, the following events are emitted by puppeteer's page:
 *  - 'request' emitted when the request is issued by the page.
 *  - 'response' emitted when/if the response is received for the request.
 *  - 'requestfinished' emitted when the response body is downloaded and the request is complete.
 *
 * If request fails at some point, then instead of 'requestfinished' event (and possibly instead of 'response' event), the 'requestfailed' event is emitted.
 * If request gets a 'redirect' response, the request is successfully finished with the 'requestfinished' event, and a new request is issued to a redirected url.
 * Request class represents requests which are sent by page.
 * Request implements Body mixin, which in case of HTTP POST requests allows clients to call request.json() or request.text() to get different representations of request's body.
 */
export interface Request {
  abort(): void
  continue(overrides?: {
    url?: string
    method?: string
    postData?: any
    headers?: any
  }): void
  headers: any
  method: string
  postData: any
  response(): Response
  url: string
}

/**
 * Response class represents responses which are received by page.
 * Response implements Body mixin, which allows clients to call response.json() or response.text() to get different representations of response body.
 */
export interface Response {
  buffer(): Promise<Buffer>
  headers: any
  json<T = Object>(): Promise<T>
  ok: boolean
  request(): Request
  status: number
  text(): Promise<string>
  url: string
}

/**
 * Keyboard provides an api for managing a virtual keyboard.
 * The high level api is page.type, which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.
 * For finer control, you can use keyboard.down, keyboard.up, and keyboard.sendCharacter to manually fire events as if they were generated from a real keyboard.
 */
export interface Keyboard {
  down(key: string, options?: {
    text?: string
  }): Promise<void>
  sendCharacter(char: string): Promise<void>
  /**
   * @param key Name of key to release, such as `ArrowLeft`
   */
  up(key: string): Promise<void>
}

export interface Mouse {
  /**
   * Shortcut for mouse.move, mouse.down and mouse.up
   */
  click(x: number, y: number, options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
    delay?: number
  }): Promise<void>
  down(options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
  }): Promise<void>
  move(x: number, y: number): Promise<void>
  up(options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
  }): Promise<void>
}

/**
 * ElementHandle represents an in-page DOM element.
 * ElementHandles could be created with the page.$ method.
 */
export interface ElementHandler {
  click(selector: string, options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
    delay?: number
  }): Promise<void>
  dispose(): Promise<void>
  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T>
  hover(): Promise<void>
}

export interface Tracing {
  start(options: {
    path: string
    screenshots?: boolean
  }): Promise<void>
  stop(): Promise<void>
}

export function connect(options: ConnectOptions): Promise<Browser>
export function launch(options: LaunchOptions): Promise<Browser>
