/**
 * @license
 * Copyright 2021 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertRejects, html} from './utils.js';

async function getDragState() {
  const {page} = await getTestState({skipLaunch: true});
  return parseInt(
    await page.$eval('#drag-state', element => {
      return element.innerHTML;
    }),
    10,
  );
}

describe("Legacy Drag n' Drop", function () {
  setupTestBrowserHooks();

  it('should emit a dragIntercepted event when dragged', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    assert.isFalse(page.isDragInterceptionEnabled());
    await page.setDragInterception(true);
    assert.isTrue(page.isDragInterceptionEnabled());
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});

    assert(data instanceof Object);
    assert.lengthOf(data.items, 1);
    assert.strictEqual(await getDragState(), 1);
  });
  it('should emit a dragEnter', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    assert.isFalse(page.isDragInterceptionEnabled());
    await page.setDragInterception(true);
    assert.isTrue(page.isDragInterceptionEnabled());
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    using dropzone = (await page.$('#drop'))!;
    await dropzone.dragEnter(data);

    assert.strictEqual(await getDragState(), 12);
  });
  it('should emit a dragOver event', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    assert.isFalse(page.isDragInterceptionEnabled());
    await page.setDragInterception(true);
    assert.isTrue(page.isDragInterceptionEnabled());
    using draggable = (await page.$('#drag'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    using dropzone = (await page.$('#drop'))!;
    await dropzone.dragEnter(data);
    await dropzone.dragOver(data);

    assert.strictEqual(await getDragState(), 123);
  });
  it('can be dropped', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    assert.isFalse(page.isDragInterceptionEnabled());
    await page.setDragInterception(true);
    assert.isTrue(page.isDragInterceptionEnabled());
    using draggable = (await page.$('#drag'))!;
    using dropzone = (await page.$('#drop'))!;
    const data = await draggable.drag({x: 1, y: 1});
    assert(data instanceof Object);
    await dropzone.dragEnter(data);
    await dropzone.dragOver(data);
    await dropzone.drop(data);

    assert.strictEqual(await getDragState(), 12334);
  });
  it('can be dragged and dropped with a single function', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    assert.isFalse(page.isDragInterceptionEnabled());
    await page.setDragInterception(true);
    assert.isTrue(page.isDragInterceptionEnabled());
    using draggable = (await page.$('#drag'))!;
    using dropzone = (await page.$('#drop'))!;
    await draggable.dragAndDrop(dropzone);

    assert.strictEqual(await getDragState(), 12334);
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

    assert.strictEqual(await getDragState(), 1234);
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

    assert.strictEqual(await getDragState(), 123);

    await page.mouse.up();
    assert.strictEqual(await getDragState(), 1234);
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

    assert.strictEqual(await getDragState(), 1234);
  });
  it('should release the mouse button when the drop fails', async () => {
    const {page} = await getTestState();

    // The page re-renders while the drag is in flight, which detaches the
    // dragged node, as a reactive list would. The drop then fails.
    await page.setContent(html`
      <div id="drag">drag me</div>
      <div id="drop">drop here</div>
      <script>
        let rerendered = false;
        document.addEventListener('mousemove', () => {
          if (rerendered) {
            return;
          }
          rerendered = true;
          const drag = document.getElementById('drag');
          drag.replaceWith(drag.cloneNode(true));
        });
      </script>
    `);

    using draggable = await page.$('#drag');
    assert(draggable);
    using dropzone = await page.$('#drop');
    assert(dropzone);

    await draggable.drag(dropzone);
    await assertRejects(dropzone.drop(draggable));

    // The drag pressed the mouse button down. If the failed drop leaves it
    // pressed, every later mouse event still carries it, and the next click
    // fires twice.
    await page.evaluate(() => {
      (globalThis as unknown as {buttons?: number}).buttons = undefined;
      document.addEventListener(
        'mousemove',
        event => {
          (globalThis as unknown as {buttons?: number}).buttons = event.buttons;
        },
        {once: true},
      );
    });
    await page.mouse.move(20, 20);

    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as unknown as {buttons?: number}).buttons;
      }),
      0,
    );
  });
});
