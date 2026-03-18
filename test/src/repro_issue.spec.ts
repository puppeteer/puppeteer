/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Repro Issue', function () {
  setupTestBrowserHooks();

  it.only('should not hang on setContent with networkidle0 and BiDi', async function () {
    this.timeout(10000);
    const {page} = await getTestState();
    await page.setContent(
      '<!DOCTYPE html><html><body><h1>Hello</h1></body></html>',
      {waitUntil: 'networkidle0', timeout: 5000},
    );
    const pdf = await page.pdf({format: 'Letter'});
    expect(pdf.length).toBeGreaterThan(0);
  });
});
