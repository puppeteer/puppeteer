---
sidebar_label: ElementHandle
---

# ElementHandle class

ElementHandle represents an in-page DOM element.

#### Signature:

```typescript
export declare class ElementHandle<ElementType extends Node = Element> extends JSHandle<ElementType>
```

**Extends:** [JSHandle](./puppeteer.jshandle.md)&lt;ElementType&gt;

## Remarks

ElementHandles can be created with the [Page.$()](./puppeteer.page._.md) method.

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const hrefElement = await page.$('a');
  await hrefElement.click();
  // ...
})();
```

ElementHandle prevents the DOM element from being garbage-collected unless the handle is [disposed](./puppeteer.jshandle.dispose.md). ElementHandles are auto-disposed when their origin frame gets navigated.

ElementHandle instances can be used as arguments in [Page.$eval()](./puppeteer.page._eval.md) and [Page.evaluate()](./puppeteer.page.evaluate.md) methods.

If you're using TypeScript, ElementHandle takes a generic argument that denotes the type of element the handle is holding within. For example, if you have a handle to a `<select>` element, you can type it as `ElementHandle<HTMLSelectElement>` and you get some nicer type checks.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ElementHandle` class.

## Properties

| Property                                    | Modifiers             | Type                          | Description |
| ------------------------------------------- | --------------------- | ----------------------------- | ----------- |
| [frame](./puppeteer.elementhandle.frame.md) | <code>readonly</code> | [Frame](./puppeteer.frame.md) |             |

## Methods

| Method                                                                                       | Modifiers | Description                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [$(selector)](./puppeteer.elementhandle._.md)                                                |           | Queries the current element for an element matching the given selector.                                                                                                                                                                                                                                                       |
| [$$(selector)](./puppeteer.elementhandle.__.md)                                              |           | Queries the current element for all elements matching the given selector.                                                                                                                                                                                                                                                     |
| [$$eval(selector, pageFunction, args)](./puppeteer.elementhandle.__eval.md)                  |           | <p>Runs the given function on an array of elements matching the given selector in the current element.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                                                               |
| [$eval(selector, pageFunction, args)](./puppeteer.elementhandle._eval.md)                    |           | <p>Runs the given function on the first element matching the given selector in the current element.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                                                                  |
| [$x(expression)](./puppeteer.elementhandle._x.md)                                            |           |                                                                                                                                                                                                                                                                                                                               |
| [asElement()](./puppeteer.elementhandle.aselement.md)                                        |           |                                                                                                                                                                                                                                                                                                                               |
| [boundingBox()](./puppeteer.elementhandle.boundingbox.md)                                    |           | This method returns the bounding box of the element (relative to the main frame), or <code>null</code> if the element is not visible.                                                                                                                                                                                         |
| [boxModel()](./puppeteer.elementhandle.boxmodel.md)                                          |           | This method returns boxes of the element, or <code>null</code> if the element is not visible.                                                                                                                                                                                                                                 |
| [click(this, options)](./puppeteer.elementhandle.click.md)                                   |           | This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.mouse.md) to click in the center of the element. If the element is detached from DOM, the method throws an error.                                                                                                                |
| [clickablePoint(offset)](./puppeteer.elementhandle.clickablepoint.md)                        |           | Returns the middle point within an element unless a specific offset is provided.                                                                                                                                                                                                                                              |
| [contentFrame()](./puppeteer.elementhandle.contentframe.md)                                  |           | Resolves to the content frame for element handles referencing iframe nodes, or null otherwise                                                                                                                                                                                                                                 |
| [drag(this, target)](./puppeteer.elementhandle.drag.md)                                      |           | This method creates and captures a dragevent from the element.                                                                                                                                                                                                                                                                |
| [dragAndDrop(this, target, options)](./puppeteer.elementhandle.draganddrop.md)               |           | This method triggers a dragenter, dragover, and drop on the element.                                                                                                                                                                                                                                                          |
| [dragEnter(this, data)](./puppeteer.elementhandle.dragenter.md)                              |           | This method creates a <code>dragenter</code> event on the element.                                                                                                                                                                                                                                                            |
| [dragOver(this, data)](./puppeteer.elementhandle.dragover.md)                                |           | This method creates a <code>dragover</code> event on the element.                                                                                                                                                                                                                                                             |
| [drop(this, data)](./puppeteer.elementhandle.drop.md)                                        |           | This method triggers a drop on the element.                                                                                                                                                                                                                                                                                   |
| [focus()](./puppeteer.elementhandle.focus.md)                                                |           | Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.                                                                                                                                                                                                                             |
| [hover(this)](./puppeteer.elementhandle.hover.md)                                            |           | This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.mouse.md) to hover over the center of the element. If the element is detached from DOM, the method throws an error.                                                                                                              |
| [isIntersectingViewport(this, options)](./puppeteer.elementhandle.isintersectingviewport.md) |           | Resolves to true if the element is visible in the current viewport.                                                                                                                                                                                                                                                           |
| [press(key, options)](./puppeteer.elementhandle.press.md)                                    |           | Focuses the element, and then uses [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).                                                                                                                                                                                           |
| [screenshot(this, options)](./puppeteer.elementhandle.screenshot.md)                         |           | This method scrolls element into view if needed, and then uses to take a screenshot of the element. If the element is detached from DOM, the method throws an error.                                                                                                                                                          |
| [select(values)](./puppeteer.elementhandle.select.md)                                        |           | Triggers a <code>change</code> and <code>input</code> event once all the provided options have been selected. If there's no <code>&lt;select&gt;</code> element matching <code>selector</code>, the method throws an error.                                                                                                   |
| [tap(this)](./puppeteer.elementhandle.tap.md)                                                |           | This method scrolls element into view if needed, and then uses [Touchscreen.tap()](./puppeteer.touchscreen.tap.md) to tap in the center of the element. If the element is detached from DOM, the method throws an error.                                                                                                      |
| [toElement(tagName)](./puppeteer.elementhandle.toelement.md)                                 |           | Converts the current handle to the given element type.                                                                                                                                                                                                                                                                        |
| [touchEnd(this)](./puppeteer.elementhandle.touchend.md)                                      |           |                                                                                                                                                                                                                                                                                                                               |
| [touchMove(this)](./puppeteer.elementhandle.touchmove.md)                                    |           |                                                                                                                                                                                                                                                                                                                               |
| [touchStart(this)](./puppeteer.elementhandle.touchstart.md)                                  |           |                                                                                                                                                                                                                                                                                                                               |
| [type(text, options)](./puppeteer.elementhandle.type.md)                                     |           | <p>Focuses the element, and then sends a <code>keydown</code>, <code>keypress</code>/<code>input</code>, and <code>keyup</code> event for each character in the text.</p><p>To press a special key, like <code>Control</code> or <code>ArrowDown</code>, use [ElementHandle.press()](./puppeteer.elementhandle.press.md).</p> |
| [uploadFile(this, filePaths)](./puppeteer.elementhandle.uploadfile.md)                       |           | This method expects <code>elementHandle</code> to point to an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).                                                                                                                                                                               |
| [waitForSelector(selector, options)](./puppeteer.elementhandle.waitforselector.md)           |           | <p>Wait for an element matching the given selector to appear in the current element.</p><p>Unlike [Frame.waitForSelector()](./puppeteer.frame.waitforselector.md), this method does not work across navigations or if the element is detached from DOM.</p>                                                                   |
| [waitForXPath(xpath, options)](./puppeteer.elementhandle.waitforxpath.md)                    |           |                                                                                                                                                                                                                                                                                                                               |
