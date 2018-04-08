import { Connection as RealConnection, CDPSession as RealCDPSession } from './Connection.js';
import * as RealBrowser from './Browser.js';
import * as RealTarget from './Target.js';
import * as RealPage from './Page.js';
import * as RealTaskQueue from './TaskQueue.js';
import {Mouse as RealMouse, Keyboard as RealKeyboard, Touchscreen as RealTouchscreen}  from './Input.js';
import {Frame as RealFrame, FrameManager as RealFrameManager}  from './FrameManager.js';
import {JSHandle as RealJSHandle, ExecutionContext as RealExecutionContext}  from './ExecutionContext.js';
import * as RealElementHandle  from './ElementHandle.js';
import { NetworkManager as RealNetworkManager, Request as RealRequest, Response as RealResponse } from './NetworkManager.js';
import * as child_process from 'child_process';
declare global {
  module Puppeteer {
    export class Connection extends RealConnection {}
    export class CDPSession extends RealCDPSession {
      on<T extends keyof Protocol.Events>(event: T, listener: (arg: Protocol.Events[T]) => void): this;
      send<T extends keyof Protocol.CommandParameters>(message: T, parameters?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T]>;
    }
    export class Mouse extends RealMouse {}
    export class Keyboard extends RealKeyboard {}
    export class Touchscreen extends RealTouchscreen {}
    export class TaskQueue extends RealTaskQueue {}
    export class Browser extends RealBrowser {}
    export class Target extends RealTarget {}
    export class Frame extends RealFrame {}
    export class FrameManager extends RealFrameManager {}
    export class NetworkManager extends RealNetworkManager {}
    export class ElementHandle extends RealElementHandle {}
    export class JSHandle extends RealJSHandle {}
    export class ExecutionContext extends RealExecutionContext {}
    export class Page extends RealPage { }
    export class Response extends RealResponse { }
    export class Request extends RealRequest { }

    export interface ConnectionTransport extends NodeJS.EventEmitter {
      send(string);
      close();
    }

    export interface TargetInfo {
      type: string;
      targetId: string;
      title: string;
      url: string;
      attached: boolean;
    }

    export interface ChildProcess extends child_process.ChildProcess {}

  }
}