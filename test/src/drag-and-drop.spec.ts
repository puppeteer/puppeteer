/**
 * Copyright 2021 Google Inc. All rights reserved.
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

import assert from 'assert';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

async function getDragState() {
  const {page} = await getTestState({skipLaunch: true});
  return parseInt(
    await page.$eval('#drag-state', element => {
      return element.innerHTML;
    }),
    10
  );
}

describe("Legacy Drag n' Drop", function () {
  setupTestBrowserHooks();

  it('should emit a dragIntercepted event when dragged', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    expect(page.isDragInterceptionEnabled()).toBe(false);
    await page.setDragInterception(true);
    expect(page.isDragInterceptionEnabled()).toBe(true);
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});

    assert(data instanceof Object);
    expect(data.items).toHaveLength(1);
    expect(await getDragState()).toBe(1);
  });
  it('should emit a dragEnter', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    expect(page.isDragInterceptionEnabled()).toBe(false);
    await page.setDragInterception(true);
    expect(page.isDragInterceptionEnabled()).toBe(true);
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    using dropzone = (await page.$('#drop'))!;
    await dropzone.dragEnter(data);

    expect(await getDragState()).toBe(12);
  });
  it('should emit a dragOver event', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    expect(page.isDragInterceptionEnabled()).toBe(false);
    await page.setDragInterception(true);
    expect(page.isDragInterceptionEnabled()).toBe(true);
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    using dropzone = (await page.$('#drop'))!;
    await dropzone.dragEnter(data);
    await dropzone.dragOver(data);

    expect(await getDragState()).toBe(123);
  });
  it('can be dropped', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    expect(page.isDragInterceptionEnabled()).toBe(false);
    await page.setDragInterception(true);
    expect(page.isDragInterceptionEnabled()).toBe(true);
    using draggable = (await page.$('#drag'))!;
    using dropzone = (await page.$('#drop'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    await dropzone.dragEnter(data);
    await dropzone.dragOver(data);
    await dropzone.drop(data);

    expect(await getDragState()).toBe(12334);
  });
  it('can be dragged and dropped with a single function', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    expect(page.isDragInterceptionEnabled()).toBe(false);
    await page.setDragInterception(true);
    expect(page.isDragInterceptionEnabled()).toBe(true);
    using draggable = (await page.$('#drag'))!;
    using dropzone = (await page.$('#drop'))!;
    await draggable.dragAndDrop(dropzone);

    expect(await getDragState()).toBe(12334);
  });
});

describe("Drag n' Drop", () => {
  setupTestBrowserHooks();

  it('should drop', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');

    using draggable = await page.$('#drag');
    assert(draggable);
    using dropzone = await page.$('#drop');
    assert(dropzone);

    await dropzone.drop(draggable);

    expect(await getDragState()).toBe(1234);
  });
  it('should drop using mouse', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');

    using draggable = await page.$('#drag');
    assert(draggable);
    using dropzone = await page.$('#drop');
    assert(dropzone);

    await draggable.hover();
    await page.mouse.down();
    await dropzone.hover();

    expect(await getDragState()).toBe(123);

    await page.mouse.up();
    expect(await getDragState()).toBe(1234);
  });
  it('should drag and drop', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');

    using draggable = await page.$('#drag');
    assert(draggable);
    using dropzone = await page.$('#drop');
    assert(dropzone);

    await draggable.drag(dropzone);
    await dropzone.drop(draggable);

    expect(await getDragState()).toBe(1234);
  });
});
