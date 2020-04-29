import {Page as RealPage} from './Page.js';
import * as child_process from 'child_process';
declare global {
  module Puppeteer {
    export class Page extends RealPage { }


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

    /* TODO(jacktfranklin@): these are duplicated from Launcher.ts.
     * Once src/Puppeteer is migrated to TypeScript it can use those defs
     * and we can delete these.
     */
    export interface ProductLauncher {
      launch(object)
      connect(object)
      executablePath: () => string,
      defaultArgs(object)
      product:string,
    }

    export interface ChromeArgOptions {
      headless?: boolean;
      args?: string[];
      userDataDir?: string;
      devtools?: boolean;
    }

    export interface LaunchOptions {
      executablePath?: string;
      ignoreDefaultArgs?: boolean | string[];
      handleSIGINT?: boolean;
      handleSIGTERM?: boolean;
      handleSIGHUP?: boolean;
      timeout?: number;
      dumpio?: boolean;
      env?: Record<string, string | undefined>;
      pipe?: boolean;
    }

    export interface BrowserOptions {
      ignoreHTTPSErrors?: boolean;
      defaultViewport?: Puppeteer.Viewport;
      slowMo?: number;
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
