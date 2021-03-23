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
/// <reference types="node" />
import { PuppeteerLifeCycleEvent } from './LifecycleWatcher.js';
import { JSHandle, ElementHandle } from './JSHandle.js';
import { ExecutionContext } from './ExecutionContext.js';
import { TimeoutSettings } from './TimeoutSettings.js';
import { MouseButton } from './Input.js';
import { FrameManager, Frame } from './FrameManager.js';
import { SerializableOrJSHandle, EvaluateHandleFn, WrapElementHandle, EvaluateFn, EvaluateFnReturnType, UnwrapPromiseLike } from './EvalTypes.js';
/**
 * @public
 */
export interface WaitForSelectorOptions {
    visible?: boolean;
    hidden?: boolean;
    timeout?: number;
}
/**
 * @internal
 */
export interface PageBinding {
    name: string;
    pptrFunction: Function;
}
/**
 * @internal
 */
export declare class DOMWorld {
    private _frameManager;
    private _frame;
    private _timeoutSettings;
    private _documentPromise?;
    private _contextPromise?;
    private _contextResolveCallback?;
    private _detached;
    /**
     * @internal
     */
    _waitTasks: Set<WaitTask>;
    /**
     * @internal
     * Contains mapping from functions that should be bound to Puppeteer functions.
     */
    _boundFunctions: Map<string, Function>;
    private _ctxBindings;
    private static bindingIdentifier;
    constructor(frameManager: FrameManager, frame: Frame, timeoutSettings: TimeoutSettings);
    frame(): Frame;
    _setContext(context?: ExecutionContext): Promise<void>;
    _hasContext(): boolean;
    _detach(): void;
    executionContext(): Promise<ExecutionContext>;
    evaluateHandle<HandlerType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandlerType>;
    evaluate<T extends EvaluateFn>(pageFunction: T, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    $(selector: string): Promise<ElementHandle | null>;
    _document(): Promise<ElementHandle>;
    $x(expression: string): Promise<ElementHandle[]>;
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    $$(selector: string): Promise<ElementHandle[]>;
    content(): Promise<string>;
    setContent(html: string, options?: {
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<void>;
    /**
     * Adds a script tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     */
    addScriptTag(options: {
        url?: string;
        path?: string;
        content?: string;
        type?: string;
    }): Promise<ElementHandle>;
    /**
     * Adds a style tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     *
     */
    addStyleTag(options: {
        url?: string;
        path?: string;
        content?: string;
    }): Promise<ElementHandle>;
    click(selector: string, options: {
        delay?: number;
        button?: MouseButton;
        clickCount?: number;
    }): Promise<void>;
    focus(selector: string): Promise<void>;
    hover(selector: string): Promise<void>;
    select(selector: string, ...values: string[]): Promise<string[]>;
    tap(selector: string): Promise<void>;
    type(selector: string, text: string, options?: {
        delay: number;
    }): Promise<void>;
    waitForSelector(selector: string, options: WaitForSelectorOptions): Promise<ElementHandle | null>;
    private _settingUpBinding;
    /**
     * @internal
     */
    addBindingToContext(context: ExecutionContext, name: string): Promise<void>;
    private _onBindingCalled;
    /**
     * @internal
     */
    waitForSelectorInPage(queryOne: Function, selector: string, options: WaitForSelectorOptions, binding?: PageBinding): Promise<ElementHandle | null>;
    waitForXPath(xpath: string, options: WaitForSelectorOptions): Promise<ElementHandle | null>;
    waitForFunction(pageFunction: Function | string, options?: {
        polling?: string | number;
        timeout?: number;
    }, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
    title(): Promise<string>;
}
/**
 * @internal
 */
export interface WaitTaskOptions {
    domWorld: DOMWorld;
    predicateBody: Function | string;
    title: string;
    polling: string | number;
    timeout: number;
    binding?: PageBinding;
    args: SerializableOrJSHandle[];
}
/**
 * @internal
 */
export declare class WaitTask {
    _domWorld: DOMWorld;
    _polling: string | number;
    _timeout: number;
    _predicateBody: string;
    _args: SerializableOrJSHandle[];
    _binding: PageBinding;
    _runCount: number;
    promise: Promise<JSHandle>;
    _resolve: (x: JSHandle) => void;
    _reject: (x: Error) => void;
    _timeoutTimer?: NodeJS.Timeout;
    _terminated: boolean;
    constructor(options: WaitTaskOptions);
    terminate(error: Error): void;
    rerun(): Promise<void>;
    _cleanup(): void;
}
//# sourceMappingURL=DOMWorld.d.ts.map