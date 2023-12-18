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
});
