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

import {spawn, execSync} from 'child_process';
import path from 'path';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describe('Fixtures', function () {
  setupTestBrowserHooks();

  it('dumpio option should work with pipe option', async () => {
    const {defaultBrowserOptions, puppeteerPath, headless} =
      await getTestState();
    if (headless !== 'true') {
      // This test only works in the old headless mode.
      return;
    }

    let dumpioData = '';
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
      dumpioData += data.toString('utf8');
    });
    await new Promise(resolve => {
      return res.on('close', resolve);
    });
    expect(dumpioData).toContain('message from dumpio');
  });
  it('should dump browser process stderr', async () => {
    const {defaultBrowserOptions, puppeteerPath} = await getTestState();

    let dumpioData = '';
    const options = Object.assign({}, defaultBrowserOptions, {dumpio: true});
    const res = spawn('node', [
      path.join(__dirname, '../fixtures', 'dumpio.js'),
      puppeteerPath,
      JSON.stringify(options),
    ]);
    res.stderr.on('data', data => {
      dumpioData += data.toString('utf8');
    });
    await new Promise(resolve => {
      return res.on('close', resolve);
    });
    expect(dumpioData).toContain('DevTools listening on ws://');
  });
  it('should close the browser when the node process closes', async () => {
    const {defaultBrowserOptions, puppeteerPath, puppeteer} =
      await getTestState();

    const options = Object.assign({}, defaultBrowserOptions, {
      // Disable DUMPIO to cleanly read stdout.
      dumpio: false,
    });
    const res = spawn('node', [
      path.join(__dirname, '../fixtures', 'closeme.js'),
      puppeteerPath,
      JSON.stringify(options),
    ]);
    let killed = false;
    function killProcess() {
      if (killed) {
        return;
      }
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${res.pid} /T /F`);
      } else {
        process.kill(res.pid!);
      }
      killed = true;
    }
    try {
      let wsEndPointCallback: (value: string) => void;
      const wsEndPointPromise = new Promise<string>(x => {
        wsEndPointCallback = x;
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
        waitEvent(browser, 'disconnected'),
        new Promise(resolve => {
          res.on('close', resolve);
        }),
      ];
      killProcess();
      await Promise.all(promises);
    } finally {
      killProcess();
    }
  });
});
