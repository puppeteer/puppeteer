/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import expect from 'expect';
import * as utils from 'puppeteer-core/internal/common/util.js';
import sinon from 'sinon';

import {launch} from './mocha-utils.js';

describe('Tracing', function () {
  let outputFile!: string;
  let testState: Awaited<ReturnType<typeof launch>>;

  /* we manually manage the browser here as we want a new browser for each
   * individual test, which isn't the default behaviour of getTestState()
   */
  beforeEach(async () => {
    testState = await launch({}, {createContext: true});
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
      fs.readFileSync(outputFile, {encoding: 'utf8'}),
    );
    const traceConfig = JSON.parse(traceJson.metadata['trace-config']);
    expect(traceConfig.included_categories).toEqual([
      'disabled-by-default-devtools.timeline.frame',
    ]);
    expect(traceConfig.excluded_categories).toEqual(['*']);
    expect(traceJson.traceEvents).not.toContainEqual(
      expect.objectContaining({
        cat: 'toplevel',
      }),
    );
  });

  it('should run with default categories', async () => {
    const {page} = testState;
    await page.tracing.start({
      path: outputFile,
    });
    await page.tracing.stop();

    const traceJson = JSON.parse(
      fs.readFileSync(outputFile, {encoding: 'utf8'}),
    );
    expect(traceJson.traceEvents).toContainEqual(
      expect.objectContaining({
        cat: 'toplevel',
      }),
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
  it('should return a typedArray', async () => {
    const {page, server} = testState;

    await page.tracing.start({screenshots: true, path: outputFile});
    await page.goto(server.PREFIX + '/grid.html');
    const trace = (await page.tracing.stop())!;
    const buf = fs.readFileSync(outputFile);
    expect(trace).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(trace).toString()).toEqual(buf.toString());
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

    const oldGetReadableAsBuffer = utils.getReadableAsTypedArray;
    sinon.stub(utils, 'getReadableAsTypedArray').callsFake(() => {
      return oldGetReadableAsBuffer({
        getReader() {
          return {
            done: false,
            read() {
              if (!this.done) {
                this.done = true;
                return {done: false, value: null};
              }
              return {done: true};
            },
          };
        },
      } as unknown as ReadableStream);
    });

    const trace = await page.tracing.stop();
    expect(trace).toEqual(undefined);
  });

  it('should support a typedArray without a path', async () => {
    const {page, server} = testState;

    await page.tracing.start({screenshots: true});
    await page.goto(server.PREFIX + '/grid.html');
    const trace = (await page.tracing.stop())!;
    expect(Buffer.from(trace).toString()).toContain('screenshot');
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
