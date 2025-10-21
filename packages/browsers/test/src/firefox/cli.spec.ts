/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sinon from 'sinon';

import * as firefox from '../../../lib/esm/browser-data/firefox.js';
import {CLI} from '../../../lib/esm/CLI.js';
import {
  createMockedReadlineInterface,
  getServerUrl,
  setupTestServer,
} from '../utils.js';
import {testFirefoxBuildId} from '../versions.js';

describe('Firefox CLI', function () {
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

    sinon.restore();
  });

  it('should download Firefox binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox@${testFirefoxBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, 'firefox', `linux-${testFirefoxBuildId}`, 'firefox'),
      ),
    );
  });

  describe('with mocked version url', () => {
    before(() => {
      firefox.changeBaseVersionUrlForTesting(getServerUrl());
    });
    after(() => {
      firefox.resetBaseVersionUrlForTesting();
    });

    it('should download latest Firefox binaries', async () => {
      serverState.server.setRoute('/firefox_versions.json', (_req, res) => {
        res.write(
          JSON.stringify({
            FIREFOX_NIGHTLY: testFirefoxBuildId.split('_').at(-1),
          }),
        );
        res.end();
      });
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'install',
        `firefox@latest`,
        `--path=${tmpDir}`,
        '--platform=linux',
        `--base-url=${getServerUrl()}`,
      ]);

      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'install',
        `firefox`,
        `--path=${tmpDir}`,
        '--platform=linux',
        `--base-url=${getServerUrl()}`,
      ]);
    });
  });
});
