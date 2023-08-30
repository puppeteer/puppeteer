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

import path from 'path';

import expect from 'expect';
import {Frame} from 'puppeteer-core/internal/api/Frame.js';
import {Page} from 'puppeteer-core/internal/api/Page.js';
import {EventEmitter} from 'puppeteer-core/internal/common/EventEmitter.js';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

import {compare} from './golden-utils.js';

const PROJECT_ROOT = path.join(__dirname, '..', '..');

declare module 'expect' {
  interface Matchers<R> {
    toBeGolden(pathOrBuffer: string | Buffer): R;
  }
}

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
            return '';
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
  using handle = await pageOrFrame.evaluateHandle(attachFrame, frameId, url);
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

export const waitEvent = async <T = any>(
  emitter: EventEmitter,
  eventName: string,
  predicate: (event: T) => boolean = () => {
    return true;
  }
): Promise<T> => {
  const deferred = Deferred.create<T>({
    timeout: 5000,
    message: `Waiting for ${eventName} event timed out.`,
  });
  const handler = (event: T) => {
    if (!predicate(event)) {
      return;
    }
    deferred.resolve(event);
  };
  emitter.on(eventName, handler);
  try {
    return await deferred.valueOrThrow();
  } finally {
    emitter.off(eventName, handler);
  }
};
