/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {rm} from 'fs/promises';
import {tmpdir} from 'os';

import expect from 'expect';
import type {Frame} from 'puppeteer-core/internal/api/Frame.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import type {EventEmitter} from 'puppeteer-core/internal/common/EventEmitter.js';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

import {compare} from './golden-utils.js';

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

export const attachFrame = async (
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string
): Promise<Frame> => {
  using handle = await pageOrFrame.evaluateHandle(
    async (frameId, url) => {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.id = frameId;
      document.body.appendChild(frame);
      await new Promise(x => {
        return (frame.onload = x);
      });
      return frame;
    },
    frameId,
    url
  );
  return await handle.contentFrame();
};

export const isFavicon = (request: {url: () => string | string[]}): boolean => {
  return request.url().includes('favicon.ico');
};

export async function detachFrame(
  pageOrFrame: Page | Frame,
  frameId: string
): Promise<void> {
  await pageOrFrame.evaluate(frameId => {
    const frame = document.getElementById(frameId) as HTMLIFrameElement;
    frame.remove();
  }, frameId);
}

export async function navigateFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string
): Promise<void> {
  await pageOrFrame.evaluate(
    (frameId, url) => {
      const frame = document.getElementById(frameId) as HTMLIFrameElement;
      frame.src = url;
      return new Promise(x => {
        return (frame.onload = x);
      });
    },
    frameId,
    url
  );
}

export const dumpFrames = async (
  frame: Frame,
  indentation?: string
): Promise<string[]> => {
  indentation = indentation || '';
  let description = frame.url().replace(/:\d{4,5}\//, ':<PORT>/');
  using element = await frame.frameElement();
  if (element) {
    const nameOrId = await element.evaluate(frame => {
      return frame.name || frame.id;
    });
    if (nameOrId) {
      description += ' (' + nameOrId + ')';
    }
  }
  const result = [indentation + description];
  for (const child of frame.childFrames()) {
    result.push(...(await dumpFrames(child, '    ' + indentation)));
  }
  return result;
};

export const waitEvent = async <T = any>(
  emitter: EventEmitter<any>,
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

export interface FilePlaceholder {
  filename: `${string}.webm`;
  [Symbol.dispose](): void;
}

export function getUniqueVideoFilePlaceholder(): FilePlaceholder {
  return {
    filename: `${tmpdir()}/test-video-${Math.round(
      Math.random() * 10000
    )}.webm`,
    [Symbol.dispose]() {
      void rmIfExists(this.filename);
    },
  };
}

export function rmIfExists(file: string): Promise<void> {
  return rm(file).catch(() => {});
}
