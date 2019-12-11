import { ElementHandle, JSHandle } from './JSHandle';
import { Protocol } from './protocol';
import { Response } from './NetworkManager';

export type AnyFunction = (...args: any[]) => unknown;

export type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;

/** Wraps a DOM element into an ElementHandle instance */
export type WrapElementHandle<X> = X extends Element ? ElementHandle<X> : X;

// /** Unwraps a DOM element out of an ElementHandle instance */
export type UnwrapElementHandle<X> = X extends ElementHandle<infer E> ? E : X;

export interface Timeoutable {
  /**
   * Maximum navigation time in milliseconds, pass 0 to disable timeout.
   * @default 30000
   */
  timeout?: number;
}

export interface ConnectionTransport {
  send(value: string): void;
  close(): void;
  onmessage?(message: string): void;
  onclose?(): void;
}

export interface Viewport {
  /** The page width in pixels. */
  width: number;
  /** The page height in pixels. */
  height: number;
  /**
   * Specify device scale factor (can be thought of as dpr).
   * @default 1
   */
  deviceScaleFactor?: number;
  /**
   * Whether the `meta viewport` tag is taken into account.
   * @default false
   */
  isMobile?: boolean;
  /**
   * Specifies if viewport supports touch events.
   * @default false
   */
  hasTouch?: boolean;
  /**
   * Specifies if viewport is in landscape mode.
   * @default false
   */
  isLandscape?: boolean;
}

export interface LaunchOptions extends ChromeArgOptions, BrowserOptions, Timeoutable {
  /**
   * Path to a Chromium executable to run instead of bundled Chromium. If
   * executablePath is a relative path, then it is resolved relative to current
   * working directory.
   */
  executablePath?: string;
  /**
   * Do not use `puppeteer.defaultArgs()` for launching Chromium.
   * @default false
   */
  ignoreDefaultArgs?: boolean | string[];
  /**
   * Close chrome process on Ctrl-C.
   * @default true
   */
  handleSIGINT?: boolean;
  /**
   * Close chrome process on SIGTERM.
   * @default true
   */
  handleSIGTERM?: boolean;
  /**
   * Close chrome process on SIGHUP.
   * @default true
   */
  handleSIGHUP?: boolean;
  /**
   * Whether to pipe browser process stdout and stderr into process.stdout and
   * process.stderr.
   * @default false
   */
  dumpio?: boolean;
  /**
   * Specify environment variables that will be visible to Chromium.
   * @default `process.env`.
   */
  env?: {
    [key: string]: string | boolean | number | undefined;
  };
  /**
   * Connects to the browser over a pipe instead of a WebSocket.
   * @default false
   */
  pipe?: boolean;
}

export interface ChromeArgOptions {
  /**
   * Whether to run browser in headless mode.
   * @default true unless the devtools option is true.
   */
  headless?: boolean;
  /**
   * Additional arguments to pass to the browser instance.
   * The list of Chromium flags can be found here.
   */
  args?: string[];
  /**
   * Path to a User Data Directory.
   */
  userDataDir?: string;
  /**
   * Whether to auto-open a DevTools panel for each tab.
   * If this option is true, the headless option will be set false.
   */
  devtools?: boolean;
}

export interface BrowserOptions {
  /**
   * Whether to ignore HTTPS errors during navigation.
   * @default false
   */
  ignoreHTTPSErrors?: boolean;
  /**
   * Sets a consistent viewport for each page. Defaults to an 800x600 viewport. null disables the default viewport.
   */
  defaultViewport?: Viewport | null;
  /**
   * Slows down Puppeteer operations by the specified amount of milliseconds.
   * Useful so that you can see what is going on.
   */
  slowMo?: number;
}

export interface ConnectOptions extends BrowserOptions {
  /**
   * A browser url to connect to, in format `http://${host}:${port}`.
   * Use interchangeably with browserWSEndpoint to let Puppeteer fetch it from metadata endpoint.
   */
  browserURL?: string;

  /** A browser websocket endpoint to connect to. */
  browserWSEndpoint?: string;

  /**
   * **Experimental** Specify a custom transport object for Puppeteer to use.
   */
  transport?: ConnectionTransport;
}

/** Defines `$eval` and `$$eval` for Page, Frame and ElementHandle. */
export interface Evalable {
  /**
   * This method runs `document.querySelector` within the context and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error.
   *
   * If `pageFunction` returns a Promise, then `$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R>(selector: string, pageFunction: (element: Element) => R | Promise<R>): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `document.querySelector` within the context and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error.
   *
   * If `pageFunction` returns a Promise, then `$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R, X1>(
    selector: string,
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `document.querySelector` within the context and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error.
   *
   * If `pageFunction` returns a Promise, then `$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @param x2 Second argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R, X1, X2>(
    selector: string,
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>) => R | Promise<R>,
    x1: X1,
    x2: X2
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `document.querySelector` within the context and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error.
   *
   * If `pageFunction` returns a Promise, then `$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @param x2 Second argument to pass to pageFunction
   * @param x3 Third argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R, X1, X2, X3>(
    selector: string,
    pageFunction: (
      element: Element,
      x1: UnwrapElementHandle<X1>,
      x2: UnwrapElementHandle<X2>,
      x3: UnwrapElementHandle<X3>
    ) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `document.querySelector` within the context and passes it as the first argument to `pageFunction`.
   * If there's no element matching `selector`, the method throws an error.
   *
   * If `pageFunction` returns a Promise, then `$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param args Arguments to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R>(
    selector: string,
    pageFunction: (element: Element, ...args: any[]) => R | Promise<R>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within the context and passes it as the
   * first argument to `pageFunction`.
   *
   * If `pageFunction` returns a Promise, then `$$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R>(selector: string, pageFunction: (elements: Element[]) => R | Promise<R>): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within the context and passes it as the
   * first argument to `pageFunction`.
   *
   * If `pageFunction` returns a Promise, then `$$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R, X1>(
    selector: string,
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within the context and passes it as the
   * first argument to `pageFunction`.
   *
   * If `pageFunction` returns a Promise, then `$$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @param x2 Second argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R, X1, X2>(
    selector: string,
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>) => R | Promise<R>,
    x1: X1,
    x2: X2
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within the context and passes it as the
   * first argument to `pageFunction`.
   *
   * If `pageFunction` returns a Promise, then `$$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param x1 First argument to pass to pageFunction
   * @param x2 Second argument to pass to pageFunction
   * @param x3 Third argument to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R, X1, X2, X3>(
    selector: string,
    pageFunction: (
      elements: Element[],
      x1: UnwrapElementHandle<X1>,
      x2: UnwrapElementHandle<X2>,
      x3: UnwrapElementHandle<X3>
    ) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3
  ): Promise<WrapElementHandle<R>>;

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within the context and passes it as the
   * first argument to `pageFunction`.
   *
   * If `pageFunction` returns a Promise, then `$$eval` would wait for the promise to resolve and return its value.
   *
   * @param selector A selector to query for
   * @param pageFunction Function to be evaluated in browser context
   * @param args Arguments to pass to pageFunction
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R>(
    selector: string,
    pageFunction: (elements: Element[], ...args: any[]) => R | Promise<R>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<R>>;
}
export interface JSEvalable<T = any> {
  /**
   * Evaluates a function in the browser context.
   * If the function, passed to the frame.evaluate, returns a Promise, then frame.evaluate would wait for the promise to resolve and return its value.
   * If the function passed into frame.evaluate returns a non-Serializable value, then frame.evaluate resolves to undefined.
   * @param fn Function to be evaluated in browser context
   * @param args Arguments to pass to `fn`
   */
  evaluate<V extends EvaluateFn<T>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<EvaluateFnReturnType<V>>;
  /**
   * The only difference between `evaluate` and `evaluateHandle` is that `evaluateHandle` returns in-page object (`JSHandle`).
   * If the function, passed to the `evaluateHandle`, returns a `Promise`, then `evaluateHandle` would wait for the
   * promise to resolve and return its value.
   * @param fn Function to be evaluated in browser context
   * @param args Arguments to pass to `fn`
   */
  evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>>;
}

export type EvaluateFn<T = any> = string | ((arg1: T, ...args: any[]) => any);
export type EvaluateFnReturnType<T extends EvaluateFn> = T extends (...args: any[]) => infer R
  ? UnwrapPromise<R>
  : unknown;

export type LoadEvent =
| 'load'
| 'domcontentloaded'
| 'networkidle0'
| 'networkidle2';

export type Serializable = number | string | boolean | null | Serializable[] | {[key: string]: Serializable};

export type SerializableOrJSHandle = Serializable | JSHandle;

export interface Debugger {
  (formatter: any, ...args: any[]): void;

  color: string;
  enabled: boolean;
  log: (...args: any[]) => any;
  namespace: string;
  destroy: () => boolean;
  extend: (namespace: string, delimiter?: string) => Debugger;
}

export interface WaitForSelectorOptions extends Timeoutable {
  /**
   * Wait for element to be present in DOM and to be visible,
   * i.e. to not have display: none or visibility: hidden CSS properties.
   * @default false
   */
  visible?: boolean;
  /**
   * Wait for element to not be found in the DOM or to be hidden,
   * i.e. have display: none or visibility: hidden CSS properties.
   * @default false
   */
  hidden?: boolean;
}

export interface WaitForSelectorOptionsHidden extends WaitForSelectorOptions {
  hidden: true;
}

export interface PageFnOptions extends Timeoutable {
  polling?: 'raf' | 'mutation' | number;
}

export interface StyleTagOptions {
  /** Url of the <link> tag. */
  url?: string;
  /** Path to the CSS file to be injected into frame. If `path` is a relative path, then it is resolved relative to current working directory. */
  path?: string;
  /** Raw CSS content to be injected into frame. */
  content?: string;
}

export interface ScriptTagOptions {
  /** Url of a script to be added. */
  url?: string;
  /** Path to the JavaScript file to be injected into frame. If `path` is a relative path, then it is resolved relative to current working directory. */
  path?: string;
  /** Raw JavaScript content to be injected into frame. */
  content?: string;
  /** Script type. Use 'module' in order to load a Javascript ES6 module. */
  type?: string;
}

export type MouseButton = Required<Protocol.Input.dispatchMouseEventParameters>['button'];

export interface ClickOptions {
  /** @default MouseButtons.Left */
  button?: MouseButton;
  /** @default 1 */
  clickCount?: number;
  /**
   * Time to wait between mousedown and mouseup in milliseconds.
   * @default 0
   */
  delay?: number;
}

export interface NavigationOptions extends Timeoutable {
  /**
   * When to consider navigation succeeded.
   * @default load Navigation is consider when the `load` event is fired.
   */
  waitUntil?: LoadEvent | LoadEvent[];
}

/**
 * Navigation options for `page.goto`.
 */
export interface DirectNavigationOptions extends NavigationOptions {
  /**
   * Referer header value.
   * If provided it will take preference over the referer header value set by
   * [page.setExtraHTTPHeaders()](#pagesetextrahttpheadersheaders).
   */
  referer?: string;
}

export interface FrameBase extends Evalable, JSEvalable {
  /**
   * The method queries frame for the selector.
   * If there's no such element within the frame, the method will resolve to null.
   */
  $(selector: string): Promise<ElementHandle | null>;

  /**
   * The method runs document.querySelectorAll within the frame.
   * If no elements match the selector, the return value resolve to [].
   */
  $$(selector: string): Promise<ElementHandle[]>;

  /**
   * The method evaluates the XPath expression.
   * @param expression XPath expression to evaluate.
   */
  $x(expression: string): Promise<ElementHandle[]>;

  /** Adds a `<script>` tag into the page with the desired url or content. */
  addScriptTag(options: ScriptTagOptions): Promise<ElementHandle>;

  /** Adds a `<link rel="stylesheet">` tag into the page with the desired url or a `<style type="text/css">` tag with the content. */
  addStyleTag(options: StyleTagOptions): Promise<ElementHandle>;

  /**
   * This method fetches an element with selector, scrolls it into view if needed, and
   * then uses `page.mouse` to click in the center of the element. If there's no element
   * matching selector, the method throws an error.
   * @param selector A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
   * @param options Specifies the click options.
   */
  click(selector: string, options?: ClickOptions): Promise<void>;

  /** Gets the full HTML contents of the page, including the doctype. */
  content(): Promise<string>;

  /**
   * Navigates to a URL.
   * @param url URL to navigate page to. The url should include scheme, e.g. `https://`
   * @param options The navigation parameters.
   */
  goto(url: string, options?: DirectNavigationOptions): Promise<Response>;

  /** This method fetches an element with selector and focuses it. */
  focus(selector: string): Promise<void>;

  /**
   * This method fetches an element with `selector`, scrolls it into view if needed,
   * and then uses page.mouse to hover over the center of the element. If there's no
   * element matching `selector`, the method throws an error.
   * @param selector A selector to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered.
   */
  hover(selector: string): Promise<void>;

  /**
   * Triggers a `change` and `input` event once all the provided options have been selected.
   * If there's no `<select>` element matching selector, the method throws an error.
   * @param selector A selector to query page for.
   * @param values Values of options to select. If the `<select>` has the `multiple` attribute,
   * all values are considered, otherwise only the first one is taken into account.
   */
  select(selector: string, ...values: string[]): Promise<string[]>;

  /**
   * Sets the page content.
   * @param html HTML markup to assign to the page.
   * @param options The navigation parameters.
   */
  setContent(html: string, options?: NavigationOptions): Promise<void>;

  /**
   * This method fetches an element with `selector`, scrolls it into view if needed,
   * and then uses page.touchscreen to tap in the center of the element.
   * @param selector A `selector` to search for element to tap. If there are multiple elements
   * satisfying the selector, the first will be tapped.
   */
  tap(selector: string): Promise<void>;

  /** Returns page's title. */
  title(): Promise<string>;

  /**
   * Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.
   * @param selector A selector of an element to type into. If there are multiple elements satisfying the selector, the first will be used.
   * @param text: A text to type into a focused element.
   * @param options: The typing parameters.
   */
  type(selector: string, text: string, options?: { delay: number }): Promise<void>;

  /** Returns frame's url. */
  url(): string;

  /**
   * Waits for a certain amount of time before resolving.
   * @param duration The time to wait for.
   */
  waitFor(duration: number): Promise<void>;
  /**
   * Shortcut for waitForSelector and waitForXPath
   */
  waitFor(selector: string, options: WaitForSelectorOptionsHidden): Promise<ElementHandle | null>;
  waitFor(selector: string, options?: WaitForSelectorOptions): Promise<ElementHandle>;

  /**
   * Shortcut for waitForFunction.
   */
  waitFor(
    selector: EvaluateFn,
    options?: WaitForSelectorOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle>;

  /**
   * Allows waiting for various conditions.
   */
  waitForFunction(
    fn: EvaluateFn,
    options?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle>;

  /**
   * Wait for the page navigation occur.
   * @param options The navigation parameters.
   */
  waitForNavigation(options?: NavigationOptions): Promise<Response>;

  waitForSelector(
    selector: string,
    options?: WaitForSelectorOptions,
  ): Promise<ElementHandle | null>;
  waitForSelector(
      selector: string,
      options?: WaitForSelectorOptionsHidden,
  ): Promise<ElementHandle | null>;

  waitForXPath(
    xpath: string,
    options?: WaitForSelectorOptions,
  ): Promise<ElementHandle | null>;
}
