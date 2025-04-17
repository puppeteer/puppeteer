---
sidebar_label: ElementHandle
---

# ElementHandle class

ElementHandle represents an in-page DOM element.

### Signature

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

<span id="frame">frame</span>

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

<span id="_">[$(selector)](./puppeteer.elementhandle._.md)</span>

</td><td>

</td><td>

Queries the current element for an element matching the given selector.

</td></tr>
<tr><td>

<span id="__">[$$(selector, options)](./puppeteer.elementhandle.__.md)</span>

</td><td>

</td><td>

Queries the current element for all elements matching the given selector.

</td></tr>
<tr><td>

<span id="__eval">[$$eval(selector, pageFunction, args)](./puppeteer.elementhandle.__eval.md)</span>

</td><td>

</td><td>

Runs the given function on an array of elements matching the given selector in the current element.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

<span id="_eval">[$eval(selector, pageFunction, args)](./puppeteer.elementhandle._eval.md)</span>

</td><td>

</td><td>

Runs the given function on the first element matching the given selector in the current element.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

<span id="autofill">[autofill(data)](./puppeteer.elementhandle.autofill.md)</span>

</td><td>

</td><td>

If the element is a form input, you can use [ElementHandle.autofill()](./puppeteer.elementhandle.autofill.md) to test if the form is compatible with the browser's autofill implementation. Throws an error if the form cannot be autofilled.

**Remarks:**

Currently, Puppeteer supports auto-filling credit card information only and in Chrome in the new headless and headful modes only.

```ts
// Select an input on the credit card form.
const name = await page.waitForSelector('form #name');
// Trigger autofill with the desired data.
await name.autofill({
  creditCard: {
    number: '4444444444444444',
    name: 'John Smith',
    expiryMonth: '01',
    expiryYear: '2030',
    cvc: '123',
  },
});
```

</td></tr>
<tr><td>

<span id="backendnodeid">[backendNodeId()](./puppeteer.elementhandle.backendnodeid.md)</span>

</td><td>

</td><td>

When connected using Chrome DevTools Protocol, it returns a DOM.BackendNodeId for the element.

</td></tr>
<tr><td>

<span id="boundingbox">[boundingBox()](./puppeteer.elementhandle.boundingbox.md)</span>

</td><td>

</td><td>

This method returns the bounding box of the element (relative to the main frame), or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

</td></tr>
<tr><td>

<span id="boxmodel">[boxModel()](./puppeteer.elementhandle.boxmodel.md)</span>

</td><td>

</td><td>

This method returns boxes of the element, or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

**Remarks:**

Boxes are represented as an array of points; Each Point is an object `{x, y}`. Box points are sorted clock-wise.

</td></tr>
<tr><td>

<span id="click">[click(this, options)](./puppeteer.elementhandle.click.md)</span>

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to click in the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

<span id="clickablepoint">[clickablePoint(offset)](./puppeteer.elementhandle.clickablepoint.md)</span>

</td><td>

</td><td>

Returns the middle point within an element unless a specific offset is provided.

</td></tr>
<tr><td>

<span id="contentframe">[contentFrame(this)](./puppeteer.elementhandle.contentframe.md)</span>

</td><td>

</td><td>

Resolves the frame associated with the element, if any. Always exists for HTMLIFrameElements.

</td></tr>
<tr><td>

<span id="contentframe">[contentFrame()](./puppeteer.elementhandle.contentframe.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="drag">[drag(this, target)](./puppeteer.elementhandle.drag.md)</span>

</td><td>

</td><td>

Drags an element over the given element or point.

</td></tr>
<tr><td>

<span id="draganddrop">[dragAndDrop(this, target, options)](./puppeteer.elementhandle.draganddrop.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Use `ElementHandle.drop` instead.

</td></tr>
<tr><td>

<span id="dragenter">[dragEnter(this, data)](./puppeteer.elementhandle.dragenter.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Do not use. `dragenter` will automatically be performed during dragging.

</td></tr>
<tr><td>

<span id="dragover">[dragOver(this, data)](./puppeteer.elementhandle.dragover.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Do not use. `dragover` will automatically be performed during dragging.

</td></tr>
<tr><td>

<span id="drop">[drop(this, element)](./puppeteer.elementhandle.drop.md)</span>

</td><td>

</td><td>

Drops the given element onto the current one.

</td></tr>
<tr><td>

<span id="drop">[drop(this, data)](./puppeteer.elementhandle.drop.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

No longer supported.

</td></tr>
<tr><td>

<span id="focus">[focus()](./puppeteer.elementhandle.focus.md)</span>

</td><td>

</td><td>

Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.

</td></tr>
<tr><td>

<span id="hover">[hover(this)](./puppeteer.elementhandle.hover.md)</span>

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to hover over the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

<span id="ishidden">[isHidden()](./puppeteer.elementhandle.ishidden.md)</span>

</td><td>

</td><td>

An element is considered to be hidden if at least one of the following is true:

- the element has no [computed styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle).

- the element has an empty [bounding client rect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

- the element's [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) is `hidden` or `collapse`.

</td></tr>
<tr><td>

<span id="isintersectingviewport">[isIntersectingViewport(this, options)](./puppeteer.elementhandle.isintersectingviewport.md)</span>

</td><td>

</td><td>

Resolves to true if the element is visible in the current viewport. If an element is an SVG, we check if the svg owner element is in the viewport instead. See https://crbug.com/963246.

</td></tr>
<tr><td>

<span id="isvisible">[isVisible()](./puppeteer.elementhandle.isvisible.md)</span>

</td><td>

</td><td>

An element is considered to be visible if all of the following is true:

- the element has [computed styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle).

- the element has a non-empty [bounding client rect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

- the element's [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) is not `hidden` or `collapse`.

</td></tr>
<tr><td>

<span id="press">[press(key, options)](./puppeteer.elementhandle.press.md)</span>

</td><td>

</td><td>

Focuses the element, and then uses [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

**Remarks:**

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also be generated. The `text` option can be specified to force an input event to be generated.

**NOTE** Modifier keys DO affect `elementHandle.press`. Holding down `Shift` will type the text in upper case.

</td></tr>
<tr><td>

<span id="screenshot">[screenshot(options)](./puppeteer.elementhandle.screenshot.md)</span>

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

<span id="screenshot">[screenshot(options)](./puppeteer.elementhandle.screenshot.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="scrollintoview">[scrollIntoView(this)](./puppeteer.elementhandle.scrollintoview.md)</span>

</td><td>

</td><td>

Scrolls the element into view using either the automation protocol client or by calling element.scrollIntoView.

</td></tr>
<tr><td>

<span id="select">[select(values)](./puppeteer.elementhandle.select.md)</span>

</td><td>

</td><td>

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

<span id="tap">[tap(this)](./puppeteer.elementhandle.tap.md)</span>

</td><td>

</td><td>

This method scrolls element into view if needed, and then uses [Touchscreen.tap()](./puppeteer.touchscreen.tap.md) to tap in the center of the element. If the element is detached from DOM, the method throws an error.

</td></tr>
<tr><td>

<span id="toelement">[toElement(tagName)](./puppeteer.elementhandle.toelement.md)</span>

</td><td>

</td><td>

Converts the current handle to the given element type.

</td></tr>
<tr><td>

<span id="touchend">[touchEnd(this)](./puppeteer.elementhandle.touchend.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="touchmove">[touchMove(this, touch)](./puppeteer.elementhandle.touchmove.md)</span>

</td><td>

</td><td>

This method scrolls the element into view if needed, and then moves the touch to the center of the element.

</td></tr>
<tr><td>

<span id="touchstart">[touchStart(this)](./puppeteer.elementhandle.touchstart.md)</span>

</td><td>

</td><td>

This method scrolls the element into view if needed, and then starts a touch in the center of the element.

</td></tr>
<tr><td>

<span id="type">[type(text, options)](./puppeteer.elementhandle.type.md)</span>

</td><td>

</td><td>

Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [ElementHandle.press()](./puppeteer.elementhandle.press.md).

</td></tr>
<tr><td>

<span id="uploadfile">[uploadFile(this, paths)](./puppeteer.elementhandle.uploadfile.md)</span>

</td><td>

</td><td>

Sets the value of an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) to the given file paths.

**Remarks:**

This will not validate whether the file paths exists. Also, if a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd). For locals script connecting to remote chrome environments, paths must be absolute.

</td></tr>
<tr><td>

<span id="waitforselector">[waitForSelector(selector, options)](./puppeteer.elementhandle.waitforselector.md)</span>

</td><td>

</td><td>

Wait for an element matching the given selector to appear in the current element.

Unlike [Frame.waitForSelector()](./puppeteer.frame.waitforselector.md), this method does not work across navigations or if the element is detached from DOM.

</td></tr>
</tbody></table>
