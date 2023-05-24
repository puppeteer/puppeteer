---
sidebar_label: Mouse
---

# Mouse class

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

#### Signature:

```typescript
export declare class Mouse
```

## Remarks

Every `page` object has its own Mouse, accessible with \[`page.mouse`\](\#pagemouse).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Mouse` class.

## Example 1

```ts
// Using ‘page.mouse’ to trace a 100x100 square.
await page.mouse.move(0, 0);
await page.mouse.down();
await page.mouse.move(0, 100);
await page.mouse.move(100, 100);
await page.mouse.move(100, 0);
await page.mouse.move(0, 0);
await page.mouse.up();
```

**Note**: The mouse events trigger synthetic `MouseEvent`s. This means that it does not fully replicate the functionality of what a normal user would be able to do with their mouse.

For example, dragging and selecting text is not possible using `page.mouse`. Instead, you can use the [\`DocumentOrShadowRoot.getSelection()\`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/getSelection) functionality implemented in the platform.

## Example 2

For example, if you want to select all content between nodes:

```ts
await page.evaluate(
  (from, to) => {
    const selection = from.getRootNode().getSelection();
    const range = document.createRange();
    range.setStartBefore(from);
    range.setEndAfter(to);
    selection.removeAllRanges();
    selection.addRange(range);
  },
  fromJSHandle,
  toJSHandle
);
```

If you then would want to copy-paste your selection, you can use the clipboard api:

```ts
// The clipboard api does not allow you to copy, unless the tab is focused.
await page.bringToFront();
await page.evaluate(() => {
  // Copy the selected content to the clipboard
  document.execCommand('copy');
  // Obtain the content of the clipboard as a string
  return navigator.clipboard.readText();
});
```

**Note**: If you want access to the clipboard API, you have to give it permission to do so:

```ts
await browser
  .defaultBrowserContext()
  .overridePermissions('<your origin>', ['clipboard-read', 'clipboard-write']);
```

## Methods

| Method                                                                  | Modifiers | Description                                                                              |
| ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| [click(x, y, options)](./puppeteer.mouse.click.md)                      |           | Shortcut for <code>mouse.move</code>, <code>mouse.down</code> and <code>mouse.up</code>. |
| [down(options)](./puppeteer.mouse.down.md)                              |           | Presses the mouse.                                                                       |
| [drag(start, target)](./puppeteer.mouse.drag.md)                        |           | Dispatches a <code>drag</code> event.                                                    |
| [dragAndDrop(start, target, options)](./puppeteer.mouse.draganddrop.md) |           | Performs a drag, dragenter, dragover, and drop in sequence.                              |
| [dragEnter(target, data)](./puppeteer.mouse.dragenter.md)               |           | Dispatches a <code>dragenter</code> event.                                               |
| [dragOver(target, data)](./puppeteer.mouse.dragover.md)                 |           | Dispatches a <code>dragover</code> event.                                                |
| [drop(target, data)](./puppeteer.mouse.drop.md)                         |           | Performs a dragenter, dragover, and drop in sequence.                                    |
| [move(x, y, options)](./puppeteer.mouse.move.md)                        |           | Moves the mouse to the given coordinate.                                                 |
| [up(options)](./puppeteer.mouse.up.md)                                  |           | Releases the mouse.                                                                      |
| [wheel(options)](./puppeteer.mouse.wheel.md)                            |           | Dispatches a <code>mousewheel</code> event.                                              |
