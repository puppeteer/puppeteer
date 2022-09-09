/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import expect from 'expect';
import sinon from 'sinon';

import {
  getTestState,
  setupTestPageAndContextHooks,
  setupTestBrowserHooks,
} from './mocha-utils.js';

describe('Page.Events.Dialog', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('should fire', async () => {
    const {page} = getTestState();

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
    const {page} = getTestState();

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
    const {page} = getTestState();

    page.on('dialog', dialog => {
      dialog.dismiss();
    });
    const result = await page.evaluate(() => {
      return prompt('question?');
    });
    expect(result).toBe(null);
  });
});
