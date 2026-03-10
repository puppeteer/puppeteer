---
sidebar_label: Mouse
---

# Mouse class

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

### Signature

```typescript
export declare abstract class Mouse
```

## Remarks

Every `page` object has its own Mouse, accessible with [Page.mouse](./puppeteer.page.md#mouse).

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
  toJSHandle,
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

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="click">[click(x, y, options)](./puppeteer.mouse.click.md)</span>

</td><td>

</td><td>

Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.

</td></tr>
<tr><td>

<span id="down">[down(options)](./puppeteer.mouse.down.md)</span>

</td><td>

</td><td>

Presses the mouse.

</td></tr>
<tr><td>

<span id="drag">[drag(start, target)](./puppeteer.mouse.drag.md)</span>

</td><td>

</td><td>

Dispatches a `drag` event.

</td></tr>
<tr><td>

<span id="draganddrop">[dragAndDrop(start, target, options)](./puppeteer.mouse.draganddrop.md)</span>

</td><td>

</td><td>

Performs a drag, dragenter, dragover, and drop in sequence.

</td></tr>
<tr><td>

<span id="dragenter">[dragEnter(target, data)](./puppeteer.mouse.dragenter.md)</span>

</td><td>

</td><td>

Dispatches a `dragenter` event.

</td></tr>
<tr><td>

<span id="dragover">[dragOver(target, data)](./puppeteer.mouse.dragover.md)</span>

</td><td>

</td><td>

Dispatches a `dragover` event.

</td></tr>
<tr><td>

<span id="drop">[drop(target, data)](./puppeteer.mouse.drop.md)</span>

</td><td>

</td><td>

Performs a dragenter, dragover, and drop in sequence.

</td></tr>
<tr><td>

<span id="move">[move(x, y, options)](./puppeteer.mouse.move.md)</span>

</td><td>

</td><td>

Moves the mouse to the given coordinate.

</td></tr>
<tr><td>

<span id="reset">[reset()](./puppeteer.mouse.reset.md)</span>

</td><td>

</td><td>

Resets the mouse to the default state: No buttons pressed; position at (0,0).

</td></tr>
<tr><td>

<span id="up">[up(options)](./puppeteer.mouse.up.md)</span>

</td><td>

</td><td>

Releases the mouse.

</td></tr>
<tr><td>

<span id="wheel">[wheel(options)](./puppeteer.mouse.wheel.md)</span>

</td><td>

</td><td>

Dispatches a `mousewheel` event.

</td></tr>
</tbody></table>
