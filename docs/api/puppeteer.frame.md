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

| Property | Modifiers             | Type    | Description |
| -------- | --------------------- | ------- | ----------- |
| detached | <code>readonly</code> | boolean |             |

## Methods

| Method                                                      | Modifiers | Description                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [$](./puppeteer.frame._.md)                                 |           | Queries the frame for an element matching the given selector.                                                                                                                                                                                                              |
| [$$](./puppeteer.frame.__.md)                               |           | Queries the frame for all elements matching the given selector.                                                                                                                                                                                                            |
| [$$eval](./puppeteer.frame.__eval.md)                       |           | <p>Runs the given function on an array of elements matching the given selector in the frame.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                      |
| [$eval](./puppeteer.frame._eval.md)                         |           | <p>Runs the given function on the first element matching the given selector in the frame.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                         |
| [$x](./puppeteer.frame._x.md)                               |           |                                                                                                                                                                                                                                                                            |
| [addScriptTag](./puppeteer.frame.addscripttag.md)           |           | Adds a <code>&lt;script&gt;</code> tag into the page with the desired url or content.                                                                                                                                                                                      |
| [addStyleTag](./puppeteer.frame.addstyletag.md)             |           | Adds a <code>HTMLStyleElement</code> into the frame with the desired URL                                                                                                                                                                                                   |
| [addStyleTag](./puppeteer.frame.addstyletag_1.md)           |           | Adds a <code>HTMLLinkElement</code> into the frame with the desired URL                                                                                                                                                                                                    |
| [childFrames](./puppeteer.frame.childframes.md)             |           | An array of child frames.                                                                                                                                                                                                                                                  |
| [click](./puppeteer.frame.click.md)                         |           | Clicks the first element found that matches <code>selector</code>.                                                                                                                                                                                                         |
| [content](./puppeteer.frame.content.md)                     |           | The full HTML contents of the frame, including the DOCTYPE.                                                                                                                                                                                                                |
| [evaluate](./puppeteer.frame.evaluate.md)                   |           | Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the the context of this frame.                                                                                                                                               |
| [evaluateHandle](./puppeteer.frame.evaluatehandle.md)       |           | Behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of this frame.                                                                                                                                       |
| [focus](./puppeteer.frame.focus.md)                         |           | Focuses the first element that matches the <code>selector</code>.                                                                                                                                                                                                          |
| [goto](./puppeteer.frame.goto.md)                           |           | Navigates the frame to the given <code>url</code>.                                                                                                                                                                                                                         |
| [hover](./puppeteer.frame.hover.md)                         |           | Hovers the pointer over the center of the first element that matches the <code>selector</code>.                                                                                                                                                                            |
| [isDetached](./puppeteer.frame.isdetached.md)               |           | Is<code>true</code> if the frame has been detached. Otherwise, <code>false</code>.                                                                                                                                                                                         |
| [isOOPFrame](./puppeteer.frame.isoopframe.md)               |           | Is <code>true</code> if the frame is an out-of-process (OOP) frame. Otherwise, <code>false</code>.                                                                                                                                                                         |
| [locator](./puppeteer.frame.locator.md)                     |           | Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.                                                                                                                                                      |
| [locator](./puppeteer.frame.locator_1.md)                   |           | Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.                                                                                                                                                      |
| [name](./puppeteer.frame.name.md)                           |           | The frame's <code>name</code> attribute as specified in the tag.                                                                                                                                                                                                           |
| [page](./puppeteer.frame.page.md)                           |           | The page associated with the frame.                                                                                                                                                                                                                                        |
| [parentFrame](./puppeteer.frame.parentframe.md)             |           | The parent frame, if any. Detached and main frames return <code>null</code>.                                                                                                                                                                                               |
| [select](./puppeteer.frame.select.md)                       |           | Selects a set of value on the first <code>&lt;select&gt;</code> element that matches the <code>selector</code>.                                                                                                                                                            |
| [setContent](./puppeteer.frame.setcontent.md)               |           | Set the content of the frame.                                                                                                                                                                                                                                              |
| [tap](./puppeteer.frame.tap.md)                             |           | Taps the first element that matches the <code>selector</code>.                                                                                                                                                                                                             |
| [title](./puppeteer.frame.title.md)                         |           | The frame's title.                                                                                                                                                                                                                                                         |
| [type](./puppeteer.frame.type.md)                           |           | Sends a <code>keydown</code>, <code>keypress</code>/<code>input</code>, and <code>keyup</code> event for each character in the text.                                                                                                                                       |
| [url](./puppeteer.frame.url.md)                             |           | The frame's URL.                                                                                                                                                                                                                                                           |
| [waitForFunction](./puppeteer.frame.waitforfunction.md)     |           |                                                                                                                                                                                                                                                                            |
| [waitForNavigation](./puppeteer.frame.waitfornavigation.md) |           | <p>Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.</p><p>Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.</p> |
| [waitForSelector](./puppeteer.frame.waitforselector.md)     |           | <p>Waits for an element matching the given selector to appear in the frame.</p><p>This method works across navigations.</p>                                                                                                                                                |
| [waitForTimeout](./puppeteer.frame.waitfortimeout.md)       |           |                                                                                                                                                                                                                                                                            |
| [waitForXPath](./puppeteer.frame.waitforxpath.md)           |           |                                                                                                                                                                                                                                                                            |
