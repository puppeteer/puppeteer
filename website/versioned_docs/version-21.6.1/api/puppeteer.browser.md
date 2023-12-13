---
sidebar_label: Browser
---

# Browser class

[Browser](./puppeteer.browser.md) represents a browser instance that is either:

- connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) or - launched by [PuppeteerNode.launch()](./puppeteer.puppeteernode.launch.md).

[Browser](./puppeteer.browser.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserEvent](./puppeteer.browserevent.md) enum.

#### Signature:

```typescript
export declare abstract class Browser extends EventEmitter<BrowserEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[BrowserEvents](./puppeteer.browserevents.md)&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Browser` class.

## Example 1

Using a [Browser](./puppeteer.browser.md) to create a [Page](./puppeteer.page.md):

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await browser.close();
```

## Example 2

Disconnecting from and reconnecting to a [Browser](./puppeteer.browser.md):

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
// Store the endpoint to be able to reconnect to the browser.
const browserWSEndpoint = browser.wsEndpoint();
// Disconnect puppeteer from the browser.
await browser.disconnect();

// Use the endpoint to reestablish a connection
const browser2 = await puppeteer.connect({browserWSEndpoint});
// Close the browser.
await browser2.close();
```

## Properties

| Property  | Modifiers             | Type    | Description                                                               |
| --------- | --------------------- | ------- | ------------------------------------------------------------------------- |
| connected | <code>readonly</code> | boolean | Whether Puppeteer is connected to this [browser](./puppeteer.browser.md). |

## Methods

| Method                                                                                         | Modifiers | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [browserContexts()](./puppeteer.browser.browsercontexts.md)                                    |           | <p>Gets a list of open [browser contexts](./puppeteer.browsercontext.md).</p><p>In a newly-created [browser](./puppeteer.browser.md), this will return a single instance of [BrowserContext](./puppeteer.browsercontext.md).</p>                                                                                                                                                                                                                                                                  |
| [close()](./puppeteer.browser.close.md)                                                        |           | Closes this [browser](./puppeteer.browser.md) and all associated [pages](./puppeteer.page.md).                                                                                                                                                                                                                                                                                                                                                                                                    |
| [createIncognitoBrowserContext(options)](./puppeteer.browser.createincognitobrowsercontext.md) |           | <p>Creates a new incognito [browser context](./puppeteer.browsercontext.md).</p><p>This won't share cookies/cache with other [browser contexts](./puppeteer.browsercontext.md).</p>                                                                                                                                                                                                                                                                                                               |
| [defaultBrowserContext()](./puppeteer.browser.defaultbrowsercontext.md)                        |           | Gets the default [browser context](./puppeteer.browsercontext.md).                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [disconnect()](./puppeteer.browser.disconnect.md)                                              |           | Disconnects Puppeteer from this [browser](./puppeteer.browser.md), but leaves the process running.                                                                                                                                                                                                                                                                                                                                                                                                |
| [isConnected()](./puppeteer.browser.isconnected.md)                                            |           | Whether Puppeteer is connected to this [browser](./puppeteer.browser.md).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [newPage()](./puppeteer.browser.newpage.md)                                                    |           | Creates a new [page](./puppeteer.page.md) in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md).                                                                                                                                                                                                                                                                                                                                                                         |
| [pages()](./puppeteer.browser.pages.md)                                                        |           | <p>Gets a list of all open [pages](./puppeteer.page.md) inside this [Browser](./puppeteer.browser.md).</p><p>If there ar multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [pages](./puppeteer.page.md) in all [browser contexts](./puppeteer.browsercontext.md).</p>                                                                                                                                                                                                  |
| [process()](./puppeteer.browser.process.md)                                                    |           | Gets the associated [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess).                                                                                                                                                                                                                                                                                                                                                                                                 |
| [target()](./puppeteer.browser.target.md)                                                      |           | Gets the [target](./puppeteer.target.md) associated with the [default browser context](./puppeteer.browser.defaultbrowsercontext.md)).                                                                                                                                                                                                                                                                                                                                                            |
| [targets()](./puppeteer.browser.targets.md)                                                    |           | <p>Gets all active [targets](./puppeteer.target.md).</p><p>In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).</p>                                                                                                                                                                                                                                                 |
| [userAgent()](./puppeteer.browser.useragent.md)                                                |           | <p>Gets this [browser's](./puppeteer.browser.md) original user agent.</p><p>[Pages](./puppeteer.page.md) can override the user agent with [Page.setUserAgent()](./puppeteer.page.setuseragent.md).</p>                                                                                                                                                                                                                                                                                            |
| [version()](./puppeteer.browser.version.md)                                                    |           | <p>Gets a string representing this [browser's](./puppeteer.browser.md) name and version.</p><p>For headless browser, this is similar to <code>&quot;HeadlessChrome/61.0.3153.0&quot;</code>. For non-headless or new-headless, this is similar to <code>&quot;Chrome/61.0.3153.0&quot;</code>. For Firefox, it is similar to <code>&quot;Firefox/116.0a1&quot;</code>.</p><p>The format of [Browser.version()](./puppeteer.browser.version.md) might change with future releases of browsers.</p> |
| [waitForTarget(predicate, options)](./puppeteer.browser.waitfortarget.md)                      |           | <p>Waits until a [target](./puppeteer.target.md) matching the given <code>predicate</code> appears and returns it.</p><p>This will look all open [browser contexts](./puppeteer.browsercontext.md).</p>                                                                                                                                                                                                                                                                                           |
| [wsEndpoint()](./puppeteer.browser.wsendpoint.md)                                              |           | <p>Gets the WebSocket URL to connect to this [browser](./puppeteer.browser.md).</p><p>This is usually used with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).</p><p>You can find the debugger URL (<code>webSocketDebuggerUrl</code>) from <code>http://HOST:PORT/json/version</code>.</p><p>See [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target) for more information.</p>                                                  |
