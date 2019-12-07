import { ElementHandle, JSHandle } from "./JSHandle";

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
  $eval<R>(
    selector: string,
    pageFunction: (element: Element) => R | Promise<R>,
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
   * @returns Promise which resolves to the return value of pageFunction
   */
  $eval<R, X1>(
    selector: string,
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1,
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
    x2: X2,
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
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>, x3: UnwrapElementHandle<X3>) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3,
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
  $$eval<R>(
    selector: string,
    pageFunction: (elements: Element[]) => R | Promise<R>,
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
   * @returns Promise which resolves to the return value of pageFunction
   */
  $$eval<R, X1>(
    selector: string,
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1,
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
    x2: X2,
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
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>, x3: UnwrapElementHandle<X3>) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3,
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
export type EvaluateFnReturnType<T extends EvaluateFn> = T extends ((...args: any[]) => infer R) ? UnwrapPromise<R> : unknown;

export type Serializable =
  | number
  | string
  | boolean
  | null
  | JSONArray
  | JSONObject;

export interface JSONArray extends Array<Serializable> { }
export interface JSONObject {
  [key: string]: Serializable;
}
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