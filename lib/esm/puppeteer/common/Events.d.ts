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
/**
 * IMPORTANT: we are mid-way through migrating away from this Events.ts file
 * in favour of defining events next to the class that emits them.
 *
 * However we need to maintain this file for now because the legacy DocLint
 * system relies on them. Be aware in the mean time if you make a change here
 * you probably need to replicate it in the relevant class. For example if you
 * add a new Page event, you should update the PageEmittedEvents enum in
 * src/common/Page.ts.
 *
 * Chat to @jackfranklin if you're unsure.
 */
export declare const Events: {
    readonly Page: {
        readonly Close: "close";
        readonly Console: "console";
        readonly Dialog: "dialog";
        readonly DOMContentLoaded: "domcontentloaded";
        readonly Error: "error";
        readonly PageError: "pageerror";
        readonly Request: "request";
        readonly Response: "response";
        readonly RequestFailed: "requestfailed";
        readonly RequestFinished: "requestfinished";
        readonly FrameAttached: "frameattached";
        readonly FrameDetached: "framedetached";
        readonly FrameNavigated: "framenavigated";
        readonly Load: "load";
        readonly Metrics: "metrics";
        readonly Popup: "popup";
        readonly WorkerCreated: "workercreated";
        readonly WorkerDestroyed: "workerdestroyed";
    };
    readonly Browser: {
        readonly TargetCreated: "targetcreated";
        readonly TargetDestroyed: "targetdestroyed";
        readonly TargetChanged: "targetchanged";
        readonly Disconnected: "disconnected";
    };
    readonly BrowserContext: {
        readonly TargetCreated: "targetcreated";
        readonly TargetDestroyed: "targetdestroyed";
        readonly TargetChanged: "targetchanged";
    };
    readonly NetworkManager: {
        readonly Request: symbol;
        readonly Response: symbol;
        readonly RequestFailed: symbol;
        readonly RequestFinished: symbol;
    };
    readonly FrameManager: {
        readonly FrameAttached: symbol;
        readonly FrameNavigated: symbol;
        readonly FrameDetached: symbol;
        readonly LifecycleEvent: symbol;
        readonly FrameNavigatedWithinDocument: symbol;
        readonly ExecutionContextCreated: symbol;
        readonly ExecutionContextDestroyed: symbol;
    };
    readonly Connection: {
        readonly Disconnected: symbol;
    };
    readonly CDPSession: {
        readonly Disconnected: symbol;
    };
};
//# sourceMappingURL=Events.d.ts.map