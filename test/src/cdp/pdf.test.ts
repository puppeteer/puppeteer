/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile, unlink} from 'node:fs/promises';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('Page.pdf', () => {
  setupTestBrowserHooks();

  it('can print to PDF with accessible', async () => {
    const {page, server} = await getTestState();

    const outputFile = import.meta.dirname + '/../../assets/output.pdf';
    const outputFileAccessible =
      import.meta.dirname + '/../../assets/output-accessible.pdf';
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

    const outputFile = import.meta.dirname + '/../../assets/output.pdf';
    const outputFileOutlined =
      import.meta.dirname + '/../../assets/output-outlined.pdf';
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

  it('can print to PDF with custom mm and pt dimensions', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/pdf.html');
    const mmPdf = await page.pdf({
      width: '556.27mm',
      height: '145.27mm',
    });
    const mmText = new TextDecoder('latin1').decode(mmPdf);
    const mediaBoxMatch = mmText.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    expect(mediaBoxMatch).toBeTruthy();
    expect(Math.round(Number(mediaBoxMatch![1]))).toBe(1577);
    expect(Math.round(Number(mediaBoxMatch![2]))).toBe(412);

    const ptPdf = await page.pdf({
      width: '72pt',
      height: '6pc',
    });
    const ptText = new TextDecoder('latin1').decode(ptPdf);
    expect(ptText).toContain('/MediaBox [0 0 72 72]');
  });
});
