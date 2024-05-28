/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
    if (headless !== 'shell') {
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
    const {defaultBrowserOptions, isFirefox, puppeteerPath} =
      await getTestState();

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
    if (isFirefox && defaultBrowserOptions.protocol === 'webDriverBiDi') {
      expect(dumpioData).toContain('WebDriver BiDi listening on ws://');
    } else {
      expect(dumpioData).toContain('DevTools listening on ws://');
    }
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
      const connectOptions = Object.assign({}, defaultBrowserOptions, {
        browserWSEndpoint: await wsEndPointPromise,
      });
      using browser = await puppeteer.connect(connectOptions);
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
