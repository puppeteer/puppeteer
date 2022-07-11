---
sidebar_label: Frame
---

# Frame class

At every point of time, page exposes its current frame tree via the [page.mainFrame](./puppeteer.page.mainframe.md) and [frame.childFrames](./puppeteer.frame.childframes.md) methods.

**Signature:**

```typescript
export declare class Frame
```

## Remarks

`Frame` object lifecycles are controlled by three events that are all dispatched on the page object:

- [PageEmittedEvents.FrameAttached](./puppeteer.pageemittedevents.md)

- [PageEmittedEvents.FrameNavigated](./puppeteer.pageemittedevents.md)

- [PageEmittedEvents.FrameDetached](./puppeteer.pageemittedevents.md)

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Frame` class.

## Example 1

An example of dumping frame tree:

```ts
const puppeteer = require('puppeteer');

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

## Example 2

An example of getting text from an iframe element:

```ts
const frame = page.frames().find(frame => frame.name() === 'myframe');
const text = await frame.$eval('.selector', element => element.textContent);
console.log(text);
```

## Methods

| Method                                                                               | Modifiers | Description                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [$(selector)](./puppeteer.frame._.md)                                                |           | This method queries the frame for the given selector.                                                                                                                                             |
| [$$(selector)](./puppeteer.frame.__.md)                                              |           | This runs <code>document.querySelectorAll</code> in the frame and returns the result.                                                                                                             |
| [$$eval(selector, pageFunction, args)](./puppeteer.frame.__eval.md)                  |           |                                                                                                                                                                                                   |
| [$eval(selector, pageFunction, args)](./puppeteer.frame._eval.md)                    |           |                                                                                                                                                                                                   |
| [$x(expression)](./puppeteer.frame._x.md)                                            |           | This method evaluates the given XPath expression and returns the results.                                                                                                                         |
| [addScriptTag(options)](./puppeteer.frame.addscripttag.md)                           |           | Adds a <code>&lt;script&gt;</code> tag into the page with the desired url or content.                                                                                                             |
| [addStyleTag(options)](./puppeteer.frame.addstyletag.md)                             |           | Adds a <code>&lt;link rel=&quot;stylesheet&quot;&gt;</code> tag into the page with the desired url or a <code>&lt;style type=&quot;text/css&quot;&gt;</code> tag with the content.                |
| [childFrames()](./puppeteer.frame.childframes.md)                                    |           |                                                                                                                                                                                                   |
| [click(selector, options)](./puppeteer.frame.click.md)                               |           | This method clicks the first element found that matches <code>selector</code>.                                                                                                                    |
| [content()](./puppeteer.frame.content.md)                                            |           |                                                                                                                                                                                                   |
| [evaluate(pageFunction, args)](./puppeteer.frame.evaluate.md)                        |           |                                                                                                                                                                                                   |
| [evaluateHandle(pageFunction, args)](./puppeteer.frame.evaluatehandle.md)            |           |                                                                                                                                                                                                   |
| [executionContext()](./puppeteer.frame.executioncontext.md)                          |           |                                                                                                                                                                                                   |
| [focus(selector)](./puppeteer.frame.focus.md)                                        |           | This method fetches an element with <code>selector</code> and focuses it.                                                                                                                         |
| [goto(url, options)](./puppeteer.frame.goto.md)                                      |           |                                                                                                                                                                                                   |
| [hover(selector)](./puppeteer.frame.hover.md)                                        |           | This method fetches an element with <code>selector</code>, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.mouse.md) to hover over the center of the element.         |
| [isDetached()](./puppeteer.frame.isdetached.md)                                      |           |                                                                                                                                                                                                   |
| [isOOPFrame()](./puppeteer.frame.isoopframe.md)                                      |           |                                                                                                                                                                                                   |
| [name()](./puppeteer.frame.name.md)                                                  |           |                                                                                                                                                                                                   |
| [page()](./puppeteer.frame.page.md)                                                  |           |                                                                                                                                                                                                   |
| [parentFrame()](./puppeteer.frame.parentframe.md)                                    |           |                                                                                                                                                                                                   |
| [select(selector, values)](./puppeteer.frame.select.md)                              |           | Triggers a <code>change</code> and <code>input</code> event once all the provided options have been selected.                                                                                     |
| [setContent(html, options)](./puppeteer.frame.setcontent.md)                         |           | Set the content of the frame.                                                                                                                                                                     |
| [tap(selector)](./puppeteer.frame.tap.md)                                            |           | This method fetches an element with <code>selector</code>, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.touchscreen.md) to tap in the center of the element. |
| [title()](./puppeteer.frame.title.md)                                                |           |                                                                                                                                                                                                   |
| [type(selector, text, options)](./puppeteer.frame.type.md)                           |           | Sends a <code>keydown</code>, <code>keypress</code>/<code>input</code>, and <code>keyup</code> event for each character in the text.                                                              |
| [url()](./puppeteer.frame.url.md)                                                    |           |                                                                                                                                                                                                   |
| [waitForFunction(pageFunction, options, args)](./puppeteer.frame.waitforfunction.md) |           |                                                                                                                                                                                                   |
| [waitForNavigation(options)](./puppeteer.frame.waitfornavigation.md)                 |           |                                                                                                                                                                                                   |
| [waitForSelector(selector, options)](./puppeteer.frame.waitforselector.md)           |           |                                                                                                                                                                                                   |
| [waitForTimeout(milliseconds)](./puppeteer.frame.waitfortimeout.md)                  |           | Causes your script to wait for the given number of milliseconds.                                                                                                                                  |
| [waitForXPath(xpath, options)](./puppeteer.frame.waitforxpath.md)                    |           |                                                                                                                                                                                                   |
