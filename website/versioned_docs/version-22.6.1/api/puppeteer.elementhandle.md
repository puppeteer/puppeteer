---
sidebar_label: ElementHandle
---

# ElementHandle class

ElementHandle represents an in-page DOM element.

#### Signature:

```typescript
export declare abstract class ElementHandle<ElementType extends Node = Element> extends JSHandle<ElementType>
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

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

frame

</td><td>

`readonly`

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

Frame corresponding to the current handle.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[$(selector)](./puppeteer.elementhandle._.md)

</td><td>

</td><td>

Queries the current element for an element matching the given selector.

</td></tr>
<tr><td>

[$$(selector)](./puppeteer.elementhandle.__.md)

</td><td>

</td><td>

Queries the current element for all elements matching the given selector.

</td></tr>
<tr><td>

[$$eval(selector, pageFunction, args)](./puppeteer.elementhandle.__eval.md)

</td><td>

</td><td>

Runs the given function on an array of elements matching the given selector in the current element.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

[$eval(selector, pageFunction, args)](./puppeteer.elementhandle._eval.md)

</td><td>

</td><td>

Runs the given function on the first element matching the given selector in the current element.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

[autofill(data)](./puppeteer.elementhandle.autofill.md)

</td><td>

</td><td>

If the element is a form input, you can use [ElementHandle.autofill()](./puppeteer.elementhandle.autofill.md) to test if the form is compatible with the browser's autofill implementation. Throws an error if the form cannot be autofilled.

</td></tr>
<tr><td>

[boundingBox()](./puppeteer.elementhandle.boundingbox.md)

</td><td>

</td><td>

This method returns the bounding box of the element (relative to the main frame), or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

</td></tr>
<tr><td>

[boxModel()](./puppeteer.elementhandle.boxmodel.md)

</td><td>

</td><td>

This method returns boxes of the element, or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

</td></tr>
<tr><td>

[click(this, options)](./puppeteer.elementhandle.click.md)

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to click in the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

[clickablePoint(offset)](./puppeteer.elementhandle.clickablepoint.md)

</td><td>

</td><td>

Returns the middle point within an element unless a specific offset is provided.

</td></tr>
<tr><td>

[contentFrame(this)](./puppeteer.elementhandle.contentframe.md)

</td><td>

</td><td>

Resolves the frame associated with the element, if any. Always exists for HTMLIFrameElements.

</td></tr>
<tr><td>

[contentFrame()](./puppeteer.elementhandle.contentframe_1.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[drag(this, target)](./puppeteer.elementhandle.drag.md)

</td><td>

</td><td>

Drags an element over the given element or point.

</td></tr>
<tr><td>

[dragAndDrop(this, target, options)](./puppeteer.elementhandle.draganddrop.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[dragEnter(this, data)](./puppeteer.elementhandle.dragenter.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[dragOver(this, data)](./puppeteer.elementhandle.dragover.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[drop(this, element)](./puppeteer.elementhandle.drop.md)

</td><td>

</td><td>

Drops the given element onto the current one.

</td></tr>
<tr><td>

[drop(this, data)](./puppeteer.elementhandle.drop_1.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[focus()](./puppeteer.elementhandle.focus.md)

</td><td>

</td><td>

Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.

</td></tr>
<tr><td>

[hover(this)](./puppeteer.elementhandle.hover.md)

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page](./puppeteer.page.md) to hover over the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

[isHidden()](./puppeteer.elementhandle.ishidden.md)

</td><td>

</td><td>

Checks if an element is hidden using the same mechanism as [ElementHandle.waitForSelector()](./puppeteer.elementhandle.waitforselector.md).

</td></tr>
<tr><td>

[isIntersectingViewport(this, options)](./puppeteer.elementhandle.isintersectingviewport.md)

</td><td>

</td><td>

Resolves to true if the element is visible in the current viewport. If an element is an SVG, we check if the svg owner element is in the viewport instead. See https://crbug.com/963246.

</td></tr>
<tr><td>

[isVisible()](./puppeteer.elementhandle.isvisible.md)

</td><td>

</td><td>

Checks if an element is visible using the same mechanism as [ElementHandle.waitForSelector()](./puppeteer.elementhandle.waitforselector.md).

</td></tr>
<tr><td>

[press(key, options)](./puppeteer.elementhandle.press.md)

</td><td>

</td><td>

Focuses the element, and then uses [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

</td></tr>
<tr><td>

[screenshot(options)](./puppeteer.elementhandle.screenshot.md)

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot_1.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

[screenshot(options)](./puppeteer.elementhandle.screenshot_1.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[scrollIntoView(this)](./puppeteer.elementhandle.scrollintoview.md)

</td><td>

</td><td>

Scrolls the element into view using either the automation protocol client or by calling element.scrollIntoView.

</td></tr>
<tr><td>

[select(values)](./puppeteer.elementhandle.select.md)

</td><td>

</td><td>

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[tap(this)](./puppeteer.elementhandle.tap.md)

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Touchscreen.tap()](./puppeteer.touchscreen.tap.md) to tap in the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

[toElement(tagName)](./puppeteer.elementhandle.toelement.md)

</td><td>

</td><td>

Converts the current handle to the given element type.

</td></tr>
<tr><td>

[touchEnd(this)](./puppeteer.elementhandle.touchend.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[touchMove(this)](./puppeteer.elementhandle.touchmove.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[touchStart(this)](./puppeteer.elementhandle.touchstart.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[type(text, options)](./puppeteer.elementhandle.type.md)

</td><td>

</td><td>

Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [ElementHandle.press()](./puppeteer.elementhandle.press.md).

</td></tr>
<tr><td>

[uploadFile(this, paths)](./puppeteer.elementhandle.uploadfile.md)

</td><td>

</td><td>

Sets the value of an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) to the given file paths.

</td></tr>
<tr><td>

[waitForSelector(selector, options)](./puppeteer.elementhandle.waitforselector.md)

</td><td>

</td><td>

Wait for an element matching the given selector to appear in the current element.

Unlike [Frame.waitForSelector()](./puppeteer.frame.waitforselector.md), this method does not work across navigations or if the element is detached from DOM.

</td></tr>
</tbody></table>
