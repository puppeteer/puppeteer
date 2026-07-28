/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import sinon from 'sinon';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Page.Events.Dialog', function () {
  setupTestBrowserHooks();

  it('should fire', async () => {
    const {page} = await getTestState();

    const onDialog = sinon.stub().callsFake(dialog => {
      dialog.accept();
    });
    page.on('dialog', onDialog);

    await page.evaluate(() => {
      return alert('yo');
    });

    expect(onDialog.callCount).toEqual(1);
    const dialog = onDialog.firstCall.args[0]!;
    expect(dialog.type()).toBe('alert');
    expect(dialog.defaultValue()).toBe('');
    expect(dialog.message()).toBe('yo');
  });

  it('should allow accepting prompts', async () => {
    const {page} = await getTestState();

    const onDialog = sinon.stub().callsFake(dialog => {
      dialog.accept('answer!');
    });
    page.on('dialog', onDialog);

    const result = await page.evaluate(() => {
      return prompt('question?', 'yes.');
    });

    expect(onDialog.callCount).toEqual(1);
    const dialog = onDialog.firstCall.args[0]!;
    expect(dialog.type()).toBe('prompt');
    expect(dialog.defaultValue()).toBe('yes.');
    expect(dialog.message()).toBe('question?');

    expect(result).toBe('answer!');
  });
  it('should dismiss the prompt', async () => {
    const {page} = await getTestState();

    page.on('dialog', dialog => {
      void dialog.dismiss();
    });
    const result = await page.evaluate(() => {
      return prompt('question?');
    });
    expect(result).toBe(null);
  });
  it('should see dialogs handled by other connections', async () => {
    const {page, server, browser, puppeteer, defaultBrowserOptions} =
      await getTestState();

    await page.goto(server.EMPTY_PAGE);

    using browser2 = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
      protocol: defaultBrowserOptions.protocol,
    });
    const page2 = await browser2.pages().then(pages => {
      return pages.find(p => {
        return p.url() === server.EMPTY_PAGE;
      });
    });
    if (!page2) {
      throw new Error('Could not find page2');
    }

    const dialog1Promise = new Promise<any>(resolve => {
      page.once('dialog', resolve);
    });
    const dialog2Promise = new Promise<any>(resolve => {
      page2.once('dialog', resolve);
    });

    const evaluatePromise = page2.evaluate(() => {
      return prompt('question?', 'yes.');
    });

    const dialog1 = await dialog1Promise;
    const dialog2 = await dialog2Promise;

    await dialog2.accept('answer!');

    const result = await evaluatePromise;
    expect(result).toBe('answer!');

    // Wait for the event to be processed by the first connection.
    await page.evaluate(() => {
      return 1;
    });

    expect(dialog1.handled).toBe(true);
    expect(dialog2.handled).toBe(true);
  });
});
