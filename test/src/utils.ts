/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import expect from 'expect';
import path from 'path';
import {Frame} from '../../lib/cjs/puppeteer/common/FrameManager.js';
import {Page} from '../../lib/cjs/puppeteer/common/Page.js';
import {EventEmitter} from '../../lib/cjs/puppeteer/common/EventEmitter.js';
import {compare} from './golden-utils.js';

const PROJECT_ROOT = path.join(__dirname, '..', '..');

export const extendExpectWithToBeGolden = (
  goldenDir: string,
  outputDir: string
): void => {
  expect.extend({
    toBeGolden: (testScreenshot: string | Buffer, goldenFilePath: string) => {
      const result = compare(
        goldenDir,
        outputDir,
        testScreenshot,
        goldenFilePath
      );

      if (result.pass) {
        return {
          pass: true,
          message: () => {
            return void 0;
          },
        };
      } else {
        return {
          pass: false,
          message: () => {
            return result.message;
          },
        };
      }
    },
  });
};

export const projectRoot = (): string => {
  return PROJECT_ROOT;
};

export const attachFrame = async (
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string
): Promise<Frame | undefined> => {
  const handle = await pageOrFrame.evaluateHandle(attachFrame, frameId, url);
  return (await handle.asElement()?.contentFrame()) ?? undefined;

  async function attachFrame(frameId: string, url: string) {
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.id = frameId;
    document.body.appendChild(frame);
    await new Promise(x => {
      return (frame.onload = x);
    });
    return frame;
  }
};

export const isFavicon = (request: {url: () => string | string[]}): boolean => {
  return request.url().includes('favicon.ico');
};

export async function detachFrame(
  pageOrFrame: Page | Frame,
  frameId: string
): Promise<void> {
  await pageOrFrame.evaluate(detachFrame, frameId);

  function detachFrame(frameId: string) {
    const frame = document.getElementById(frameId) as HTMLIFrameElement;
    frame.remove();
  }
}

export async function navigateFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string
): Promise<void> {
  await pageOrFrame.evaluate(navigateFrame, frameId, url);

  function navigateFrame(frameId: string, url: any) {
    const frame = document.getElementById(frameId) as HTMLIFrameElement;
    frame.src = url;
    return new Promise(x => {
      return (frame.onload = x);
    });
  }
}

export const dumpFrames = (frame: Frame, indentation?: string): string[] => {
  indentation = indentation || '';
  let description = frame.url().replace(/:\d{4,5}\//, ':<PORT>/');
  if (frame.name()) {
    description += ' (' + frame.name() + ')';
  }
  const result = [indentation + description];
  for (const child of frame.childFrames()) {
    result.push(...dumpFrames(child, '    ' + indentation));
  }
  return result;
};

export const waitEvent = (
  emitter: EventEmitter,
  eventName: string,
  predicate: (event: any) => boolean = () => {
    return true;
  }
): Promise<any> => {
  return new Promise(fulfill => {
    emitter.on(eventName, function listener(event: any) {
      if (!predicate(event)) {
        return;
      }
      emitter.off(eventName, listener);
      fulfill(event);
    });
  });
};

/**
 * @deprecated Use exports directly.
 */
export default {
  extendExpectWithToBeGolden,
  waitEvent,
  dumpFrames,
  navigateFrame,
  isFavicon,
  attachFrame,
  projectRoot,
  detachFrame,
};
