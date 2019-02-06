import { Connection as RealConnection } from './Connection';
import { Target as RealTarget } from './Browser';
import * as child_process from 'child_process';
declare global {
  module Puppeteer {

    export interface ConnectionTransport {
      send(string);
      close();
      onmessage?: (message: string) => void,
      onclose?: () => void,
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

    export class Connection extends RealConnection { }
    export class Target extends RealTarget { }
  }
}
