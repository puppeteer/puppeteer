---
sidebar_label: Frame
---

# Frame class

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not affect frames inside the ambient frame the JavaScript executes in.

### Signature

```typescript
export declare abstract class Frame extends EventEmitter<FrameEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[FrameEvents](./puppeteer.frameevents.md)&gt;

## Remarks

Frame lifecycles are controlled by three events that are all dispatched on the parent [page](./puppeteer.frame.page.md):

- [PageEvent.FrameAttached](./puppeteer.pageevent.md) - [PageEvent.FrameNavigated](./puppeteer.pageevent.md) - [PageEvent.FrameDetached](./puppeteer.pageevent.md)

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Frame` class.

## Example 1

At any point in time, [pages](./puppeteer.page.md) expose their current frame tree via the [Page.mainFrame()](./puppeteer.page.mainframe.md) and [Frame.childFrames()](./puppeteer.frame.childframes.md) methods.

## Example 2

An example of dumping frame tree:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://www.google.com/chrome/browser/canary.html');
dumpFrameTree(page.mainFrame(), '');
await browser.close();

function dumpFrameTree(frame, indent) {
  console.log(indent + frame.url());
  for (const child of frame.childFrames()) {
    dumpFrameTree(child, indent + '  ');
  }
}
```

## Example 3

An example of getting text from an iframe element:

```ts
const frames = page.frames();
let frame = null;
for (const currentFrame of frames) {
  const frameElement = await currentFrame.frameElement();
  const name = await frameElement.evaluate(el => el.getAttribute('name'));
  if (name === 'myframe') {
    frame = currentFrame;
    break;
  }
}
if (frame) {
  const text = await frame.$eval('.selector', element => element.textContent);
  console.log(text);
} else {
  console.error('Frame with name "myframe" not found.');
}
```

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

<span id="detached">detached</span>

</td><td>

`readonly`

</td><td>

boolean

</td><td>

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

<span id="_">[$(selector)](./puppeteer.frame._.md)</span>

</td><td>

</td><td>

Queries the frame for an element matching the given selector.

</td></tr>
<tr><td>

<span id="__">[$$(selector, options)](./puppeteer.frame.__.md)</span>

</td><td>

</td><td>

Queries the frame for all elements matching the given selector.

</td></tr>
<tr><td>

<span id="__eval">[$$eval(selector, pageFunction, args)](./puppeteer.frame.__eval.md)</span>

</td><td>

</td><td>

Runs the given function on an array of elements matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

<span id="_eval">[$eval(selector, pageFunction, args)](./puppeteer.frame._eval.md)</span>

</td><td>

</td><td>

Runs the given function on the first element matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

<span id="addscripttag">[addScriptTag(options)](./puppeteer.frame.addscripttag.md)</span>

</td><td>

</td><td>

Adds a `<script>` tag into the page with the desired url or content.

</td></tr>
<tr><td>

<span id="addstyletag">[addStyleTag(options)](./puppeteer.frame.addstyletag.md)</span>

</td><td>

</td><td>

Adds a `HTMLStyleElement` into the frame with the desired URL

</td></tr>
<tr><td>

<span id="addstyletag">[addStyleTag(options)](./puppeteer.frame.addstyletag.md#overload-2)</span>

</td><td>

</td><td>

Adds a `HTMLLinkElement` into the frame with the desired URL

</td></tr>
<tr><td>

<span id="childframes">[childFrames()](./puppeteer.frame.childframes.md)</span>

</td><td>

</td><td>

An array of child frames.

</td></tr>
<tr><td>

<span id="click">[click(selector, options)](./puppeteer.frame.click.md)</span>

</td><td>

</td><td>

Clicks the first element found that matches `selector`.

**Remarks:**

If `click()` triggers a navigation event and there's a separate `page.waitForNavigation()` promise to be resolved, you may end up with a race condition that yields unexpected results. The correct pattern for click and wait for navigation is the following:

```ts
const [response] = await Promise.all([
  page.waitForNavigation(waitOptions),
  frame.click(selector, clickOptions),
]);
```

</td></tr>
<tr><td>

<span id="content">[content()](./puppeteer.frame.content.md)</span>

</td><td>

</td><td>

The full HTML contents of the frame, including the DOCTYPE.

</td></tr>
<tr><td>

<span id="evaluate">[evaluate(pageFunction, args)](./puppeteer.frame.evaluate.md)</span>

</td><td>

</td><td>

Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the context of this frame.

See [Page.evaluate()](./puppeteer.page.evaluate.md) for details.

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(pageFunction, args)](./puppeteer.frame.evaluatehandle.md)</span>

</td><td>

</td><td>

Behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of this frame.

See [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) for details.

</td></tr>
<tr><td>

<span id="focus">[focus(selector)](./puppeteer.frame.focus.md)</span>

</td><td>

</td><td>

Focuses the first element that matches the `selector`.

</td></tr>
<tr><td>

<span id="frameelement">[frameElement()](./puppeteer.frame.frameelement.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="goto">[goto(url, options)](./puppeteer.frame.goto.md)</span>

</td><td>

</td><td>

Navigates the frame or page to the given `url`.

**Remarks:**

Navigation to `about:blank` or navigation to the same URL with a different hash will succeed and return `null`.

:::warning

Headless shell mode doesn't support navigation to a PDF document. See the [upstream issue](https://crbug.com/761295).

:::

In headless shell, this method will not throw an error when any valid HTTP status code is returned by the remote server, including 404 "Not Found" and 500 "Internal Server Error". The status code for such responses can be retrieved by calling [HTTPResponse.status()](./puppeteer.httpresponse.status.md).

</td></tr>
<tr><td>

<span id="hover">[hover(selector)](./puppeteer.frame.hover.md)</span>

</td><td>

</td><td>

Hovers the pointer over the center of the first element that matches the `selector`.

</td></tr>
<tr><td>

<span id="isdetached">[isDetached()](./puppeteer.frame.isdetached.md)</span>

</td><td>

`deprecated`

</td><td>

Is`true` if the frame has been detached. Otherwise, `false`.

**Deprecated:**

Use the `detached` getter.

</td></tr>
<tr><td>

<span id="locator">[locator(selector)](./puppeteer.frame.locator.md)</span>

</td><td>

</td><td>

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

<span id="locator">[locator(func)](./puppeteer.frame.locator.md#overload-2)</span>

</td><td>

</td><td>

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

<span id="name">[name()](./puppeteer.frame.name.md)</span>

</td><td>

`deprecated`

</td><td>

The frame's `name` attribute as specified in the tag.

**Deprecated:**

Use

```ts
const element = await frame.frameElement();
const nameOrId = await element.evaluate(frame => frame.name ?? frame.id);
```

**Remarks:**

This value is calculated once when the frame is created, and will not update if the attribute is changed later.

</td></tr>
<tr><td>

<span id="page">[page()](./puppeteer.frame.page.md)</span>

</td><td>

</td><td>

The page associated with the frame.

</td></tr>
<tr><td>

<span id="parentframe">[parentFrame()](./puppeteer.frame.parentframe.md)</span>

</td><td>

</td><td>

The parent frame, if any. Detached and main frames return `null`.

</td></tr>
<tr><td>

<span id="select">[select(selector, values)](./puppeteer.frame.select.md)</span>

</td><td>

</td><td>

Selects a set of value on the first `<select>` element that matches the `selector`.

</td></tr>
<tr><td>

<span id="setcontent">[setContent(html, options)](./puppeteer.frame.setcontent.md)</span>

</td><td>

</td><td>

Set the content of the frame.

</td></tr>
<tr><td>

<span id="tap">[tap(selector)](./puppeteer.frame.tap.md)</span>

</td><td>

</td><td>

Taps the first element that matches the `selector`.

</td></tr>
<tr><td>

<span id="title">[title()](./puppeteer.frame.title.md)</span>

</td><td>

</td><td>

The frame's title.

</td></tr>
<tr><td>

<span id="type">[type(selector, text, options)](./puppeteer.frame.type.md)</span>

</td><td>

</td><td>

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

**Remarks:**

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.frame.url.md)</span>

</td><td>

</td><td>

The frame's URL.

</td></tr>
<tr><td>

<span id="waitforfunction">[waitForFunction(pageFunction, options, args)](./puppeteer.frame.waitforfunction.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="waitfornavigation">[waitForNavigation(options)](./puppeteer.frame.waitfornavigation.md)</span>

</td><td>

</td><td>

Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

</td></tr>
<tr><td>

<span id="waitforselector">[waitForSelector(selector, options)](./puppeteer.frame.waitforselector.md)</span>

</td><td>

</td><td>

Waits for an element matching the given selector to appear in the frame.

This method works across navigations.

</td></tr>
</tbody></table>
