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

connected

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether Puppeteer is connected to this [browser](./puppeteer.browser.md).

</td></tr>
<tr><td>

debugInfo

</td><td>

`readonly`

</td><td>

[DebugInfo](./puppeteer.debuginfo.md)

</td><td>

Get debug information from Puppeteer.

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

[browserContexts()](./puppeteer.browser.browsercontexts.md)

</td><td>

</td><td>

Gets a list of open [browser contexts](./puppeteer.browsercontext.md).

In a newly-created [browser](./puppeteer.browser.md), this will return a single instance of [BrowserContext](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[close()](./puppeteer.browser.close.md)

</td><td>

</td><td>

Closes this [browser](./puppeteer.browser.md) and all associated [pages](./puppeteer.page.md).

</td></tr>
<tr><td>

[createBrowserContext(options)](./puppeteer.browser.createbrowsercontext.md)

</td><td>

</td><td>

Creates a new [browser context](./puppeteer.browsercontext.md).

This won't share cookies/cache with other [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[defaultBrowserContext()](./puppeteer.browser.defaultbrowsercontext.md)

</td><td>

</td><td>

Gets the default [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[disconnect()](./puppeteer.browser.disconnect.md)

</td><td>

</td><td>

Disconnects Puppeteer from this [browser](./puppeteer.browser.md), but leaves the process running.

</td></tr>
<tr><td>

[isConnected()](./puppeteer.browser.isconnected.md)

</td><td>

</td><td>

Whether Puppeteer is connected to this [browser](./puppeteer.browser.md).

</td></tr>
<tr><td>

[newPage()](./puppeteer.browser.newpage.md)

</td><td>

</td><td>

Creates a new [page](./puppeteer.page.md) in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md).

</td></tr>
<tr><td>

[pages()](./puppeteer.browser.pages.md)

</td><td>

</td><td>

Gets a list of all open [pages](./puppeteer.page.md) inside this [Browser](./puppeteer.browser.md).

If there ar multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [pages](./puppeteer.page.md) in all [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[process()](./puppeteer.browser.process.md)

</td><td>

</td><td>

Gets the associated [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess).

</td></tr>
<tr><td>

[target()](./puppeteer.browser.target.md)

</td><td>

</td><td>

Gets the [target](./puppeteer.target.md) associated with the [default browser context](./puppeteer.browser.defaultbrowsercontext.md)).

</td></tr>
<tr><td>

[targets()](./puppeteer.browser.targets.md)

</td><td>

</td><td>

Gets all active [targets](./puppeteer.target.md).

In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[userAgent()](./puppeteer.browser.useragent.md)

</td><td>

</td><td>

Gets this [browser's](./puppeteer.browser.md) original user agent.

[Pages](./puppeteer.page.md) can override the user agent with [Page.setUserAgent()](./puppeteer.page.setuseragent.md).

</td></tr>
<tr><td>

[version()](./puppeteer.browser.version.md)

</td><td>

</td><td>

Gets a string representing this [browser's](./puppeteer.browser.md) name and version.

For headless browser, this is similar to `"HeadlessChrome/61.0.3153.0"`. For non-headless or new-headless, this is similar to `"Chrome/61.0.3153.0"`. For Firefox, it is similar to `"Firefox/116.0a1"`.

The format of [Browser.version()](./puppeteer.browser.version.md) might change with future releases of browsers.

</td></tr>
<tr><td>

[waitForTarget(predicate, options)](./puppeteer.browser.waitfortarget.md)

</td><td>

</td><td>

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[wsEndpoint()](./puppeteer.browser.wsendpoint.md)

</td><td>

</td><td>

Gets the WebSocket URL to connect to this [browser](./puppeteer.browser.md).

This is usually used with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

You can find the debugger URL (`webSocketDebuggerUrl`) from `http://HOST:PORT/json/version`.

See [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target) for more information.

</td></tr>
</tbody></table>
