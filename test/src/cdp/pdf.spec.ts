/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile, unlink} from 'fs/promises';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('Page.pdf', () => {
  setupTestBrowserHooks();

  it('can print to PDF with accessible', async () => {
    const {page, server} = await getTestState();

    const outputFile = __dirname + '/../../assets/output.pdf';
    const outputFileAccessible =
      __dirname + '/../../assets/output-accessible.pdf';
    await page.goto(server.PREFIX + '/pdf.html');
    await page.pdf({path: outputFile, tagged: false});
    await page.pdf({path: outputFileAccessible, tagged: true});
    try {
      const [base, tagged] = await Promise.all([
        readFile(outputFile),
        readFile(outputFileAccessible),
      ]);
      expect(tagged.byteLength).toBeGreaterThan(base.byteLength);
    } finally {
      await Promise.all([unlink(outputFile), unlink(outputFileAccessible)]);
    }
  });

  it('can print to PDF with outline', async () => {
    const {page, server} = await getTestState();

    const outputFile = __dirname + '/../../assets/output.pdf';
    const outputFileOutlined = __dirname + '/../../assets/output-outlined.pdf';
    await page.goto(server.PREFIX + '/pdf.html');
    await page.pdf({path: outputFile, tagged: true});
    await page.pdf({path: outputFileOutlined, tagged: true, outline: true});
    try {
      const [base, outlined] = await Promise.all([
        readFile(outputFile),
        readFile(outputFileOutlined),
      ]);

      expect(outlined.byteLength).toBeGreaterThan(base.byteLength);
    } finally {
      await Promise.all([unlink(outputFile), unlink(outputFileOutlined)]);
    }
  });
});
