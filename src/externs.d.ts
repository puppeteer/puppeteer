import { Browser as RealBrowser, BrowserContext as RealBrowserContext} from './Browser.js';
import {Target as RealTarget} from './Target.js';
import {Page as RealPage} from './Page.js';
import {Mouse as RealMouse, Keyboard as RealKeyboard, Touchscreen as RealTouchscreen}  from './Input.js';
import {Frame as RealFrame, FrameManager as RealFrameManager}  from './FrameManager.js';
import {DOMWorld as RealDOMWorld}  from './DOMWorld.js';
import { NetworkManager as RealNetworkManager, Request as RealRequest, Response as RealResponse } from './NetworkManager.js';
import * as child_process from 'child_process';
declare global {
  module Puppeteer {
    export class Mouse extends RealMouse {}
    export class Keyboard extends RealKeyboard {}
    export class Touchscreen extends RealTouchscreen {}
    export class Browser extends RealBrowser {}
    export class BrowserContext extends RealBrowserContext {}
    export class Target extends RealTarget {}
    export class Frame extends RealFrame {}
    export class FrameManager extends RealFrameManager {}
    export class NetworkManager extends RealNetworkManager {}
    export class DOMWorld extends RealDOMWorld {}
    export class Page extends RealPage { }
    export class Response extends RealResponse { }
    export class Request extends RealRequest { }

    export interface ConnectionTransport {
      send(string);
      close();
      onmessage?: (message: string) => void,
      onclose?: () => void,
    }

    export interface ProductLauncher {
      launch(object)
      connect(object)
      executablePath: () => string,
      defaultArgs(object)
      product:string,
    }

    export interface ChildProcess extends child_process.ChildProcess { }

    export type Viewport = {
      width: number;
      height: number;
      deviceScaleFactor?: number;
      isMobile?: boolean;
      isLandscape?: boolean;
      hasTouch?: boolean;
    }
  }
}
