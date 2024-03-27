---
sidebar_label: Frame
---

# Frame class

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not effect frames inside the ambient frame the JavaScript executes in.

#### Signature:

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

(async () => {
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
})();
```

## Example 3

An example of getting text from an iframe element:

```ts
const frame = page.frames().find(frame => frame.name() === 'myframe');
const text = await frame.$eval('.selector', element => element.textContent);
console.log(text);
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

detached

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

[$(selector)](./puppeteer.frame._.md)

</td><td>

</td><td>

Queries the frame for an element matching the given selector.

</td></tr>
<tr><td>

[$$(selector)](./puppeteer.frame.__.md)

</td><td>

</td><td>

Queries the frame for all elements matching the given selector.

</td></tr>
<tr><td>

[$$eval(selector, pageFunction, args)](./puppeteer.frame.__eval.md)

</td><td>

</td><td>

Runs the given function on an array of elements matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

[$eval(selector, pageFunction, args)](./puppeteer.frame._eval.md)

</td><td>

</td><td>

Runs the given function on the first element matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

</td></tr>
<tr><td>

[addScriptTag(options)](./puppeteer.frame.addscripttag.md)

</td><td>

</td><td>

Adds a `<script>` tag into the page with the desired url or content.

</td></tr>
<tr><td>

[addStyleTag(options)](./puppeteer.frame.addstyletag.md)

</td><td>

</td><td>

Adds a `HTMLStyleElement` into the frame with the desired URL

</td></tr>
<tr><td>

[addStyleTag(options)](./puppeteer.frame.addstyletag_1.md)

</td><td>

</td><td>

Adds a `HTMLLinkElement` into the frame with the desired URL

</td></tr>
<tr><td>

[childFrames()](./puppeteer.frame.childframes.md)

</td><td>

</td><td>

An array of child frames.

</td></tr>
<tr><td>

[click(selector, options)](./puppeteer.frame.click.md)

</td><td>

</td><td>

Clicks the first element found that matches `selector`.

</td></tr>
<tr><td>

[content()](./puppeteer.frame.content.md)

</td><td>

</td><td>

The full HTML contents of the frame, including the DOCTYPE.

</td></tr>
<tr><td>

[evaluate(pageFunction, args)](./puppeteer.frame.evaluate.md)

</td><td>

</td><td>

Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the context of this frame.

</td></tr>
<tr><td>

[evaluateHandle(pageFunction, args)](./puppeteer.frame.evaluatehandle.md)

</td><td>

</td><td>

Behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of this frame.

</td></tr>
<tr><td>

[focus(selector)](./puppeteer.frame.focus.md)

</td><td>

</td><td>

Focuses the first element that matches the `selector`.

</td></tr>
<tr><td>

[frameElement()](./puppeteer.frame.frameelement.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[goto(url, options)](./puppeteer.frame.goto.md)

</td><td>

</td><td>

Navigates the frame to the given `url`.

</td></tr>
<tr><td>

[hover(selector)](./puppeteer.frame.hover.md)

</td><td>

</td><td>

Hovers the pointer over the center of the first element that matches the `selector`.

</td></tr>
<tr><td>

[isDetached()](./puppeteer.frame.isdetached.md)

</td><td>

</td><td>

Is`true` if the frame has been detached. Otherwise, `false`.

</td></tr>
<tr><td>

[isOOPFrame()](./puppeteer.frame.isoopframe.md)

</td><td>

</td><td>

Is `true` if the frame is an out-of-process (OOP) frame. Otherwise, `false`.

</td></tr>
<tr><td>

[locator(selector)](./puppeteer.frame.locator.md)

</td><td>

</td><td>

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

[locator(func)](./puppeteer.frame.locator_1.md)

</td><td>

</td><td>

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

[name()](./puppeteer.frame.name.md)

</td><td>

</td><td>

The frame's `name` attribute as specified in the tag.

</td></tr>
<tr><td>

[page()](./puppeteer.frame.page.md)

</td><td>

</td><td>

The page associated with the frame.

</td></tr>
<tr><td>

[parentFrame()](./puppeteer.frame.parentframe.md)

</td><td>

</td><td>

The parent frame, if any. Detached and main frames return `null`.

</td></tr>
<tr><td>

[select(selector, values)](./puppeteer.frame.select.md)

</td><td>

</td><td>

Selects a set of value on the first `<select>` element that matches the `selector`.

</td></tr>
<tr><td>

[setContent(html, options)](./puppeteer.frame.setcontent.md)

</td><td>

</td><td>

Set the content of the frame.

</td></tr>
<tr><td>

[tap(selector)](./puppeteer.frame.tap.md)

</td><td>

</td><td>

Taps the first element that matches the `selector`.

</td></tr>
<tr><td>

[title()](./puppeteer.frame.title.md)

</td><td>

</td><td>

The frame's title.

</td></tr>
<tr><td>

[type(selector, text, options)](./puppeteer.frame.type.md)

</td><td>

</td><td>

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

</td></tr>
<tr><td>

[url()](./puppeteer.frame.url.md)

</td><td>

</td><td>

The frame's URL.

</td></tr>
<tr><td>

[waitForFunction(pageFunction, options, args)](./puppeteer.frame.waitforfunction.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[waitForNavigation(options)](./puppeteer.frame.waitfornavigation.md)

</td><td>

</td><td>

Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

</td></tr>
<tr><td>

[waitForSelector(selector, options)](./puppeteer.frame.waitforselector.md)

</td><td>

</td><td>

Waits for an element matching the given selector to appear in the frame.

This method works across navigations.

</td></tr>
</tbody></table>
