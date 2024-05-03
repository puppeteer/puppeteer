/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {compare} from './golden-utils.js';

declare module 'expect' {
  interface Matchers<R> {
    atLeastOneToContain(expected: string[]): R;
    toBeGolden(pathOrBuffer: string | Buffer): R;
  }
}

expect.extend({
  atLeastOneToContain: (actual: string, expected: string[]) => {
    for (const test of expected) {
      try {
        expect(actual).toContain(test);
        return {
          pass: true,
          message: () => {
            return '';
          },
        };
      } catch (err) {}
    }

    return {
      pass: false,
      message: () => {
        return `"${actual}" didn't contain any of the strings ${JSON.stringify(
          expected
        )}`;
      },
    };
  },
});

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
