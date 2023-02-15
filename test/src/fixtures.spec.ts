/**
 * Copyright 2019 Google Inc. All rights reserved.
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

/* eslint-disable @typescript-eslint/no-var-requires */

import path from 'path';

import expect from 'expect';

import {getTestState} from './mocha-utils.js';

describe('Fixtures', function () {
  it('dumpio option should work with pipe option', async () => {
    const {defaultBrowserOptions, puppeteerPath, headless} = getTestState();
    if (headless === 'new') {
      // This test only works in the old headless mode.
      return;
    }

    let dumpioData = '';
    const {spawn} = await import('child_process');
    const options = Object.assign({}, defaultBrowserOptions, {
      pipe: true,
      dumpio: true,
    });
    const res = spawn('node', [
      path.join(__dirname, '../fixtures', 'dumpio.js'),
      puppeteerPath,
      JSON.stringify(options),
    ]);
    res.stderr.on('data', data => {
      return (dumpioData += data.toString('utf8'));
    });
    await new Promise(resolve => {
      return res.on('close', resolve);
    });
    expect(dumpioData).toContain('message from dumpio');
  });
  it('should dump browser process stderr', async () => {
    const {defaultBrowserOptions, puppeteerPath} = getTestState();

    let dumpioData = '';
    const {spawn} = await import('child_process');
    const options = Object.assign({}, defaultBrowserOptions, {dumpio: true});
    const res = spawn('node', [
      path.join(__dirname, '../fixtures', 'dumpio.js'),
      puppeteerPath,
      JSON.stringify(options),
    ]);
    res.stderr.on('data', data => {
      return (dumpioData += data.toString('utf8'));
    });
    await new Promise(resolve => {
      return res.on('close', resolve);
    });
    expect(dumpioData).toContain('DevTools listening on ws://');
  });
  it('should close the browser when the node process closes', async () => {
    const {defaultBrowserOptions, puppeteerPath, puppeteer} = getTestState();

    const {spawn, execSync} = await import('child_process');
    const options = Object.assign({}, defaultBrowserOptions, {
      // Disable DUMPIO to cleanly read stdout.
      dumpio: false,
    });
    const res = spawn('node', [
      path.join(__dirname, '../fixtures', 'closeme.js'),
      puppeteerPath,
      JSON.stringify(options),
    ]);
    let wsEndPointCallback: (value: string) => void;
    const wsEndPointPromise = new Promise<string>(x => {
      return (wsEndPointCallback = x);
    });
    let output = '';
    res.stdout.on('data', data => {
      output += data;
      if (output.indexOf('\n')) {
        wsEndPointCallback(output.substring(0, output.indexOf('\n')));
      }
    });
    const browser = await puppeteer.connect({
      browserWSEndpoint: await wsEndPointPromise,
    });
    const promises = [
      new Promise(resolve => {
        return browser.once('disconnected', resolve);
      }),
      new Promise(resolve => {
        return res.on('close', resolve);
      }),
    ];
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${res.pid} /T /F`);
    } else {
      process.kill(res.pid!);
    }
    await Promise.all(promises);
  });
});
