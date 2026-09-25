/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {access, constants, rm, watch} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname} from 'node:path';

import {assert, AssertionError} from 'chai';
import type {Frame} from 'puppeteer-core/internal/api/Frame.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import type {EventEmitter} from 'puppeteer-core/internal/common/EventEmitter.js';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

import {compare} from './golden-utils.js';

let goldenDirs: {goldenDir: string; outputDir: string} | undefined;

export const setGoldenDirs = (goldenDir: string, outputDir: string): void => {
  goldenDirs = {goldenDir, outputDir};
};

/**
 * Asserts that the given screenshot (or string) matches the golden file.
 */
export const assertGolden = (
  testScreenshot: string | Uint8Array,
  goldenFilePath: string,
): void => {
  assert.exists(goldenDirs, 'Golden directories are not configured');
  const result = compare(
    goldenDirs!.goldenDir,
    goldenDirs!.outputDir,
    typeof testScreenshot === 'string'
      ? testScreenshot
      : Buffer.from(testScreenshot),
    goldenFilePath,
  );
  if (!result.pass) {
    assert.fail(result.message);
  }
};

/**
 * Awaits the given promise and asserts that it rejects. Returns the rejection
 * reason so that callers can make further assertions on it.
 */
export const assertRejects = async (
  promise: Promise<unknown> | (() => Promise<unknown>),
): Promise<any> => {
  const resolved = Symbol('resolved');
  const result = await (typeof promise === 'function' ? promise() : promise)
    .then(() => {
      return resolved;
    })
    .catch((error: unknown) => {
      return error;
    });
  assert.notStrictEqual(
    result,
    resolved,
    'Expected promise to reject, but it resolved',
  );
  return result;
};

const matchesObject = (actual: unknown, expected: unknown): boolean => {
  if (Object.is(actual, expected)) {
    return true;
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) => {
        return matchesObject(actual[index], value);
      })
    );
  }
  if (expected instanceof Date) {
    return actual instanceof Date && actual.getTime() === expected.getTime();
  }
  if (expected instanceof RegExp) {
    return actual instanceof RegExp && String(actual) === String(expected);
  }
  if (typeof expected === 'object' && expected !== null) {
    if (typeof actual !== 'object' || actual === null) {
      return false;
    }
    return Object.entries(expected).every(([key, value]) => {
      return (
        key in actual &&
        matchesObject((actual as Record<string, unknown>)[key], value)
      );
    });
  }
  return false;
};

/**
 * Asserts that `actual` matches the subset described by `expected`, with the
 * same semantics as `expect(...).toMatchObject(...)`: objects are matched
 * recursively as subsets, while arrays must have the same length and match
 * element by element.
 */
export const assertMatchObject = (
  actual: unknown,
  expected: object,
  message?: string,
): void => {
  if (!matchesObject(actual, expected)) {
    throw new AssertionError(
      message ??
        `expected ${JSON.stringify(actual)} to match object ${JSON.stringify(expected)}`,
      {actual, expected, showDiff: true},
    );
  }
};

export const attachFrame = async (
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string,
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
    url,
  );
  return await handle.contentFrame();
};

export const isFavicon = (request: {url: () => string | string[]}): boolean => {
  return request.url().includes('favicon.ico');
};

export async function detachFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
): Promise<void> {
  await pageOrFrame.evaluate(frameId => {
    const frame = document.getElementById(frameId) as HTMLIFrameElement;
    frame.remove();
  }, frameId);
}

export async function navigateFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string,
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
    url,
  );
}

export const dumpFrames = async (
  frame: Frame,
  indentation = '',
): Promise<string[]> => {
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
  },
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

export function getUniqueVideoFilePlaceholder(
  debugging = false,
): FilePlaceholder {
  const name = debugging
    ? './debugging'
    : `${tmpdir()}/test-video-${Math.round(Math.random() * 10000)}`;
  return {
    filename: `${name}.webm`,
    [Symbol.dispose]() {
      if (debugging) {
        return;
      }
      void rmIfExists(this.filename);
    },
  };
}

export function rmIfExists(file: string): Promise<void> {
  return rm(file).catch(() => {});
}

export async function waitForFileExistence(
  filePath: string,
  timeout = 1000,
): Promise<void> {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    return await new Promise(async (resolve, reject) => {
      const abortController = new AbortController();
      const timer = setTimeout(() => {
        abortController.abort();
        reject(
          new Error(
            `Exceeded timeout of ${timeout} ms for watching ${filePath}`,
          ),
        );
      }, timeout);
      const dir = dirname(filePath);
      const fileBasename = basename(filePath);
      const watcher = watch(dir, {signal: abortController.signal});
      for await (const event of watcher) {
        if (event.eventType === 'rename' && event.filename === fileBasename) {
          clearTimeout(timer);
          abortController.abort();
          resolve();
        }
      }
    });
  }
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  const bodyContent = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My test page</title>
  </head>
  <body>
    ${bodyContent}
  </body>
</html>`;
}

export function htmlRaw(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');
}
