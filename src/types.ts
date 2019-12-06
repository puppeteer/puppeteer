// import { ElementHandle } from "./JSHandle";

export type AnyFunction = (...args: any[]) => unknown;

/** Wraps a DOM element into an ElementHandle instance */
// export type WrapElementHandle<X> = X extends Element ? ElementHandle<X> : X;

// /** Unwraps a DOM element out of an ElementHandle instance */
// export type UnwrapElementHandle<X> = X extends ElementHandle<infer E> ? E : X;

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