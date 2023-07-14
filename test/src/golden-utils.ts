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
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import {diffLines} from 'diff';
import jpeg from 'jpeg-js';
import mime from 'mime';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

interface DiffFile {
  diff: string | Buffer;
  ext?: string;
}

const GoldenComparators = new Map<
  string,
  (
    actualBuffer: string | Buffer,
    expectedBuffer: string | Buffer,
    mimeType: string
  ) => DiffFile | undefined
>();

const addSuffix = (
  filePath: string,
  suffix: string,
  customExtension?: string
): string => {
  const dirname = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  return path.join(dirname, name + suffix + (customExtension || ext));
};

const compareImages = (
  actualBuffer: string | Buffer,
  expectedBuffer: string | Buffer,
  mimeType: string
): DiffFile | undefined => {
  assert(typeof actualBuffer !== 'string');
  assert(typeof expectedBuffer !== 'string');

  const actual =
    mimeType === 'image/png'
      ? PNG.sync.read(actualBuffer)
      : jpeg.decode(actualBuffer);

  const expected =
    mimeType === 'image/png'
      ? PNG.sync.read(expectedBuffer)
      : jpeg.decode(expectedBuffer);
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `Sizes differ: expected image ${expected.width}px X ${expected.height}px, but got ${actual.width}px X ${actual.height}px.`
    );
  }
  const diff = new PNG({width: expected.width, height: expected.height});
  const count = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    expected.width,
    expected.height,
    {threshold: 0.1}
  );
  return count > 0 ? {diff: PNG.sync.write(diff)} : undefined;
};

const compareText = (
  actual: string | Buffer,
  expectedBuffer: string | Buffer
): DiffFile | undefined => {
  assert(typeof actual === 'string');
  const expected = expectedBuffer.toString('utf-8');
  if (expected === actual) {
    return;
  }
  const result = diffLines(expected, actual);
  const html = result.reduce(
    (text, change) => {
      text += change.added
        ? `<span class='ins'>${change.value}</span>`
        : change.removed
        ? `<span class='del'>${change.value}</span>`
        : change.value;
      return text;
    },
    `<link rel="stylesheet" href="file://${path.join(
      __dirname,
      'diffstyle.css'
    )}">`
  );
  return {
    diff: html,
    ext: '.html',
  };
};

GoldenComparators.set('image/png', compareImages);
GoldenComparators.set('image/jpeg', compareImages);
GoldenComparators.set('text/plain', compareText);

export const compare = (
  goldenPath: string,
  outputPath: string,
  actual: string | Buffer,
  goldenName: string
): {pass: true} | {pass: false; message: string} => {
  goldenPath = path.normalize(goldenPath);
  outputPath = path.normalize(outputPath);
  const expectedPath = path.join(goldenPath, goldenName);
  const actualPath = path.join(outputPath, goldenName);

  const messageSuffix = `Output is saved in "${path.basename(
    outputPath + '" directory'
  )}`;

  if (!fs.existsSync(expectedPath)) {
    ensureOutputDir();
    fs.writeFileSync(actualPath, actual);
    return {
      pass: false,
      message: `${goldenName} is missing in golden results. ${messageSuffix}`,
    };
  }
  const expected = fs.readFileSync(expectedPath);
  const mimeType = mime.getType(goldenName);
  assert(mimeType);
  const comparator = GoldenComparators.get(mimeType);
  if (!comparator) {
    return {
      pass: false,
      message: `Failed to find comparator with type ${mimeType}: ${goldenName}`,
    };
  }
  const result = comparator(actual, expected, mimeType);
  if (!result) {
    return {pass: true};
  }
  ensureOutputDir();
  if (goldenPath === outputPath) {
    fs.writeFileSync(addSuffix(actualPath, '-actual'), actual);
  } else {
    fs.writeFileSync(actualPath, actual);
    // Copy expected to the output/ folder for convenience.
    fs.writeFileSync(addSuffix(actualPath, '-expected'), expected);
  }
  if (result) {
    const diffPath = addSuffix(actualPath, '-diff', result.ext);
    fs.writeFileSync(diffPath, result.diff);
  }

  return {
    pass: false,
    message: `${goldenName} mismatch! ${messageSuffix}`,
  };

  function ensureOutputDir() {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
  }
};
