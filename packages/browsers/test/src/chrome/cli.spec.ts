/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as chrome from '../../../lib/esm/browser-data/chrome.js';
import {CLI} from '../../../lib/esm/CLI.js';
import {
  createMockedReadlineInterface,
  setupTestServer,
  getServerUrl,
} from '../utils.js';
import {testChromeBuildId, testChromiumBuildId} from '../versions.js';

describe('Chrome CLI', function () {
  this.timeout(90000);

  const serverState = setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(async () => {
    await new CLI(tmpDir, createMockedReadlineInterface('yes')).run([
      'npx',
      '@puppeteer/browsers',
      'clear',
      `--path=${tmpDir}`,
      `--base-url=${getServerUrl()}`,
    ]);
  });

  it('should download Chrome binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeBuildId}`,
          'chrome-linux64',
          'chrome',
        ),
      ),
    );

    await new CLI(tmpDir, createMockedReadlineInterface('no')).run([
      'npx',
      '@puppeteer/browsers',
      'clear',
      `--path=${tmpDir}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeBuildId}`,
          'chrome-linux64',
          'chrome',
        ),
      ),
    );
  });

  describe('with mocked version url', () => {
    before(() => {
      chrome.changeBaseVersionUrlForTesting(getServerUrl());
    });
    after(() => {
      chrome.resetBaseVersionUrlForTesting();
    });

    it('should download latest Chrome binaries', async () => {
      serverState.server.setRoute(
        '/last-known-good-versions.json',
        (_req, res) => {
          res.write(
            JSON.stringify({
              timestamp: '2025-10-21T22:09:41.716Z',
              channels: {
                Canary: {
                  channel: 'Canary',
                  version: testChromeBuildId,
                  revision: testChromiumBuildId,
                },
              },
            }),
          );
          res.end();
        },
      );
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'install',
        `chrome@latest`,
        `--path=${tmpDir}`,
        '--platform=linux',
        `--base-url=${getServerUrl()}`,
      ]);
    });
  });
});
