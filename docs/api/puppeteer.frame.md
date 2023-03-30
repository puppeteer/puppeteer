---
sidebar_label: Frame
---

# Frame class

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not effect frames inside the ambient frame the JavaScript executes in.

#### Signature:

```typescript
export declare class Frame
```

## Remarks

Frame lifecycles are controlled by three events that are all dispatched on the parent [page](./puppeteer.frame.page.md):

- [PageEmittedEvents.FrameAttached](./puppeteer.pageemittedevents.md) - [PageEmittedEvents.FrameNavigated](./puppeteer.pageemittedevents.md) - [PageEmittedEvents.FrameDetached](./puppeteer.pageemittedevents.md)

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

## Methods

| Method                                                                               | Modifiers | Description                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [$(selector)](./puppeteer.frame._.md)                                                |           | Queries the frame for an element matching the given selector.                                                                                                                                                                                                              |
| [$$(selector)](./puppeteer.frame.__.md)                                              |           | Queries the frame for all elements matching the given selector.                                                                                                                                                                                                            |
| [$$eval(selector, pageFunction, args)](./puppeteer.frame.__eval.md)                  |           | <p>Runs the given function on an array of elements matching the given selector in the frame.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                      |
| [$eval(selector, pageFunction, args)](./puppeteer.frame._eval.md)                    |           | <p>Runs the given function on the first element matching the given selector in the frame.</p><p>If the given function returns a promise, then this method will wait till the promise resolves.</p>                                                                         |
| [$x(expression)](./puppeteer.frame._x.md)                                            |           |                                                                                                                                                                                                                                                                            |
| [addScriptTag(options)](./puppeteer.frame.addscripttag.md)                           |           | Adds a <code>&lt;script&gt;</code> tag into the page with the desired url or content.                                                                                                                                                                                      |
| [addStyleTag(options)](./puppeteer.frame.addstyletag.md)                             |           | Adds a <code>&lt;link rel=&quot;stylesheet&quot;&gt;</code> tag into the page with the desired URL or a <code>&lt;style type=&quot;text/css&quot;&gt;</code> tag with the content.                                                                                         |
| [addStyleTag(options)](./puppeteer.frame.addstyletag_1.md)                           |           |                                                                                                                                                                                                                                                                            |
| [childFrames()](./puppeteer.frame.childframes.md)                                    |           | An array of child frames.                                                                                                                                                                                                                                                  |
| [click(selector, options)](./puppeteer.frame.click.md)                               |           | Clicks the first element found that matches <code>selector</code>.                                                                                                                                                                                                         |
| [content()](./puppeteer.frame.content.md)                                            |           | The full HTML contents of the frame, including the DOCTYPE.                                                                                                                                                                                                                |
| [evaluate(pageFunction, args)](./puppeteer.frame.evaluate.md)                        |           | Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the the context of this frame.                                                                                                                                               |
| [evaluateHandle(pageFunction, args)](./puppeteer.frame.evaluatehandle.md)            |           | Behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of this frame.                                                                                                                                       |
| [focus(selector)](./puppeteer.frame.focus.md)                                        |           | Focuses the first element that matches the <code>selector</code>.                                                                                                                                                                                                          |
| [goto(url, options)](./puppeteer.frame.goto.md)                                      |           | Navigates a frame to the given url.                                                                                                                                                                                                                                        |
| [hover(selector)](./puppeteer.frame.hover.md)                                        |           | Hovers the pointer over the center of the first element that matches the <code>selector</code>.                                                                                                                                                                            |
| [isDetached()](./puppeteer.frame.isdetached.md)                                      |           | Is<code>true</code> if the frame has been detached. Otherwise, <code>false</code>.                                                                                                                                                                                         |
| [isOOPFrame()](./puppeteer.frame.isoopframe.md)                                      |           | Is <code>true</code> if the frame is an out-of-process (OOP) frame. Otherwise, <code>false</code>.                                                                                                                                                                         |
| [name()](./puppeteer.frame.name.md)                                                  |           | The frame's <code>name</code> attribute as specified in the tag.                                                                                                                                                                                                           |
| [page()](./puppeteer.frame.page.md)                                                  |           | The page associated with the frame.                                                                                                                                                                                                                                        |
| [parentFrame()](./puppeteer.frame.parentframe.md)                                    |           | The parent frame, if any. Detached and main frames return <code>null</code>.                                                                                                                                                                                               |
| [select(selector, values)](./puppeteer.frame.select.md)                              |           | Selects a set of value on the first <code>&lt;select&gt;</code> element that matches the <code>selector</code>.                                                                                                                                                            |
| [setContent(html, options)](./puppeteer.frame.setcontent.md)                         |           | Set the content of the frame.                                                                                                                                                                                                                                              |
| [tap(selector)](./puppeteer.frame.tap.md)                                            |           | Taps the first element that matches the <code>selector</code>.                                                                                                                                                                                                             |
| [title()](./puppeteer.frame.title.md)                                                |           | The frame's title.                                                                                                                                                                                                                                                         |
| [type(selector, text, options)](./puppeteer.frame.type.md)                           |           | Sends a <code>keydown</code>, <code>keypress</code>/<code>input</code>, and <code>keyup</code> event for each character in the text.                                                                                                                                       |
| [url()](./puppeteer.frame.url.md)                                                    |           | The frame's URL.                                                                                                                                                                                                                                                           |
| [waitForDevicePrompt(options)](./puppeteer.frame.waitfordeviceprompt.md)             |           | <p>This method is typically coupled with an action that triggers a device request from an api such as WebBluetooth.</p><p>:::caution</p><p>This must be called before the device request is made. It will not return a currently active device prompt.</p><p>:::</p>       |
| [waitForFunction(pageFunction, options, args)](./puppeteer.frame.waitforfunction.md) |           |                                                                                                                                                                                                                                                                            |
| [waitForNavigation(options)](./puppeteer.frame.waitfornavigation.md)                 |           | <p>Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.</p><p>Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.</p> |
| [waitForSelector(selector, options)](./puppeteer.frame.waitforselector.md)           |           | <p>Waits for an element matching the given selector to appear in the frame.</p><p>This method works across navigations.</p>                                                                                                                                                |
| [waitForTimeout(milliseconds)](./puppeteer.frame.waitfortimeout.md)                  |           |                                                                                                                                                                                                                                                                            |
| [waitForXPath(xpath, options)](./puppeteer.frame.waitforxpath.md)                    |           |                                                                                                                                                                                                                                                                            |
