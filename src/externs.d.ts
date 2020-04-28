import {Target as RealTarget} from './Target.js';
import {Page as RealPage} from './Page.js';
import {Frame as RealFrame, FrameManager as RealFrameManager}  from './FrameManager.js';
import { NetworkManager as RealNetworkManager, Request as RealRequest, Response as RealResponse } from './NetworkManager.js';
import * as child_process from 'child_process';
declare global {
  module Puppeteer {
    export class Target extends RealTarget {}
    export class Frame extends RealFrame {}
    export class FrameManager extends RealFrameManager {}
    export class NetworkManager extends RealNetworkManager {}
    export class Page extends RealPage { }
    export class Response extends RealResponse { }
    export class Request extends RealRequest { }


    /* TODO(jacktfranklin@): once DOMWorld, Page, and FrameManager are in TS
     * we can remove this and instead use the type defined in LifeCycleWatcher
     */
    export type PuppeteerLifeCycleEvent = 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

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
