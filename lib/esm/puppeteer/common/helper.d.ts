/// <reference types="node" />
import { CDPSession } from './Connection.js';
import { Protocol } from 'devtools-protocol';
import { CommonEventEmitter } from './EventEmitter.js';
export declare const debugError: (...args: unknown[]) => void;
declare function getExceptionMessage(exceptionDetails: Protocol.Runtime.ExceptionDetails): string;
declare function valueFromRemoteObject(remoteObject: Protocol.Runtime.RemoteObject): any;
declare function releaseObject(client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject): Promise<void>;
export interface PuppeteerEventListener {
    emitter: CommonEventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
}
declare function addEventListener(emitter: CommonEventEmitter, eventName: string | symbol, handler: (...args: any[]) => void): PuppeteerEventListener;
declare function removeEventListeners(listeners: Array<{
    emitter: CommonEventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
}>): void;
declare function isString(obj: unknown): obj is string;
declare function isNumber(obj: unknown): obj is number;
declare function waitForEvent<T extends any>(emitter: CommonEventEmitter, eventName: string | symbol, predicate: (event: T) => Promise<boolean> | boolean, timeout: number, abortPromise: Promise<Error>): Promise<T>;
declare function evaluationString(fun: Function | string, ...args: unknown[]): string;
declare function pageBindingInitString(type: string, name: string): string;
declare function pageBindingDeliverResultString(name: string, seq: number, result: unknown): string;
declare function pageBindingDeliverErrorString(name: string, seq: number, message: string, stack: string): string;
declare function pageBindingDeliverErrorValueString(name: string, seq: number, value: unknown): string;
declare function makePredicateString(predicate: Function, predicateQueryHandler?: Function): string;
declare function waitWithTimeout<T extends any>(promise: Promise<T>, taskName: string, timeout: number): Promise<T>;
declare function readProtocolStream(client: CDPSession, handle: string, path?: string): Promise<Buffer>;
/**
 * Loads the Node fs promises API. Needed because on Node 10.17 and below,
 * fs.promises is experimental, and therefore not marked as enumerable. That
 * means when TypeScript compiles an `import('fs')`, its helper doesn't spot the
 * promises declaration and therefore on Node <10.17 you get an error as
 * fs.promises is undefined in compiled TypeScript land.
 *
 * See https://github.com/puppeteer/puppeteer/issues/6548 for more details.
 *
 * Once Node 10 is no longer supported (April 2021) we can remove this and use
 * `(await import('fs')).promises`.
 */
declare function importFSModule(): Promise<typeof import('fs')>;
export declare const helper: {
    evaluationString: typeof evaluationString;
    pageBindingInitString: typeof pageBindingInitString;
    pageBindingDeliverResultString: typeof pageBindingDeliverResultString;
    pageBindingDeliverErrorString: typeof pageBindingDeliverErrorString;
    pageBindingDeliverErrorValueString: typeof pageBindingDeliverErrorValueString;
    makePredicateString: typeof makePredicateString;
    readProtocolStream: typeof readProtocolStream;
    waitWithTimeout: typeof waitWithTimeout;
    waitForEvent: typeof waitForEvent;
    isString: typeof isString;
    isNumber: typeof isNumber;
    importFSModule: typeof importFSModule;
    addEventListener: typeof addEventListener;
    removeEventListeners: typeof removeEventListeners;
    valueFromRemoteObject: typeof valueFromRemoteObject;
    getExceptionMessage: typeof getExceptionMessage;
    releaseObject: typeof releaseObject;
};
export {};
//# sourceMappingURL=helper.d.ts.map