/// <reference types="node" />
import { CDPSession } from './Connection.js';
/**
 * @public
 */
export interface TracingOptions {
    path?: string;
    screenshots?: boolean;
    categories?: string[];
}
/**
 * The Tracing class exposes the tracing audit interface.
 * @remarks
 * You can use `tracing.start` and `tracing.stop` to create a trace file
 * which can be opened in Chrome DevTools or {@link https://chromedevtools.github.io/timeline-viewer/ | timeline viewer}.
 *
 * @example
 * ```js
 * await page.tracing.start({path: 'trace.json'});
 * await page.goto('https://www.google.com');
 * await page.tracing.stop();
 * ```
 *
 * @public
 */
export declare class Tracing {
    _client: CDPSession;
    _recording: boolean;
    _path: string;
    /**
     * @internal
     */
    constructor(client: CDPSession);
    /**
     * Starts a trace for the current page.
     * @remarks
     * Only one trace can be active at a time per browser.
     * @param options - Optional `TracingOptions`.
     */
    start(options?: TracingOptions): Promise<void>;
    /**
     * Stops a trace started with the `start` method.
     * @returns Promise which resolves to buffer with trace data.
     */
    stop(): Promise<Buffer>;
}
//# sourceMappingURL=Tracing.d.ts.map