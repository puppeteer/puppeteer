import * as child_process from 'child_process';

declare global {
  module Puppeteer {
    export interface ConnectionTransport {
      send(string);
      close();
      onmessage?: (message: string) => void,
      onclose?: () => void,
    }

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
