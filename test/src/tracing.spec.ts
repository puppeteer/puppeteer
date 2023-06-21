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

import fs from 'fs';
import path from 'path';

import expect from 'expect';

import {launch} from './mocha-utils.js';

describe('Tracing', function () {
  let outputFile!: string;
  let testState: Awaited<ReturnType<typeof launch>>;

  /* we manually manage the browser here as we want a new browser for each
   * individual test, which isn't the default behaviour of getTestState()
   */
  beforeEach(async () => {
    testState = await launch({});
    outputFile = path.join(__dirname, 'trace.json');
  });

  afterEach(async () => {
    await testState.close();
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  it('should output a trace', async () => {
    const {server, page} = testState;
    await page.tracing.start({screenshots: true, path: outputFile});
    await page.goto(server.PREFIX + '/grid.html');
    await page.tracing.stop();
    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it('should run with custom categories if provided', async () => {
    const {page} = testState;
    await page.tracing.start({
      path: outputFile,
      categories: ['-*', 'disabled-by-default-devtools.timeline.frame'],
    });
    await page.tracing.stop();

    const traceJson = JSON.parse(
      fs.readFileSync(outputFile, {encoding: 'utf8'})
    );
    const traceConfig = JSON.parse(traceJson.metadata['trace-config']);
    expect(traceConfig.included_categories).toEqual([
      'disabled-by-default-devtools.timeline.frame',
    ]);
    expect(traceConfig.excluded_categories).toEqual(['*']);
    expect(traceJson.traceEvents).not.toContainEqual(
      expect.objectContaining({
        cat: 'toplevel',
      })
    );
  });

  it('should run with default categories', async () => {
    const {page} = testState;
    await page.tracing.start({
      path: outputFile,
    });
    await page.tracing.stop();

    const traceJson = JSON.parse(
      fs.readFileSync(outputFile, {encoding: 'utf8'})
    );
    expect(traceJson.traceEvents).toContainEqual(
      expect.objectContaining({
        cat: 'toplevel',
      })
    );
  });
  it('should throw if tracing on two pages', async () => {
    const {page, browser} = testState;
    await page.tracing.start({path: outputFile});
    const newPage = await browser.newPage();
    let error!: Error;
    await newPage.tracing.start({path: outputFile}).catch(error_ => {
      return (error = error_);
    });
    await newPage.close();
    expect(error).toBeTruthy();
    await page.tracing.stop();
  });
  it('should return a buffer', async () => {
    const {page, server} = testState;

    await page.tracing.start({screenshots: true, path: outputFile});
    await page.goto(server.PREFIX + '/grid.html');
    const trace = (await page.tracing.stop())!;
    const buf = fs.readFileSync(outputFile);
    expect(trace.toString()).toEqual(buf.toString());
  });
  it('should work without options', async () => {
    const {page, server} = testState;

    await page.tracing.start();
    await page.goto(server.PREFIX + '/grid.html');
    const trace = await page.tracing.stop();
    expect(trace).toBeTruthy();
  });

  it('should return undefined in case of Buffer error', async () => {
    const {page, server} = testState;

    await page.tracing.start({screenshots: true});
    await page.goto(server.PREFIX + '/grid.html');

    const oldBufferConcat = Buffer.concat;
    try {
      Buffer.concat = () => {
        throw new Error('error');
      };
      const trace = await page.tracing.stop();
      expect(trace).toEqual(undefined);
    } finally {
      Buffer.concat = oldBufferConcat;
    }
  });

  it('should support a buffer without a path', async () => {
    const {page, server} = testState;

    await page.tracing.start({screenshots: true});
    await page.goto(server.PREFIX + '/grid.html');
    const trace = (await page.tracing.stop())!;
    expect(trace.toString()).toContain('screenshot');
  });

  it('should properly fail if readProtocolStream errors out', async () => {
    const {page} = testState;
    await page.tracing.start({path: __dirname});

    let error!: Error;
    try {
      await page.tracing.stop();
    } catch (error_) {
      error = error_ as Error;
    }
    expect(error).toBeDefined();
  });
});
