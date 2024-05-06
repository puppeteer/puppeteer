---
sidebar_label: Browser
---

# Browser class

[Browser](./puppeteer.browser.md) represents a browser instance that is either:

- connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) or - launched by [PuppeteerNode.launch()](./puppeteer.puppeteernode.launch.md).

[Browser](./puppeteer.browser.md) [emits](./puppeteer.eventemitter.emit.md) various events which are documented in the [BrowserEvent](./puppeteer.browserevent.md) enum.

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

<span id="connected">connected</span>

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether Puppeteer is connected to this [browser](./puppeteer.browser.md).

</td></tr>
<tr><td>

<span id="debuginfo">debugInfo</span>

</td><td>

`readonly`

</td><td>

[DebugInfo](./puppeteer.debuginfo.md)

</td><td>

**_(Experimental)_** Get debug information from Puppeteer.

**Remarks:**

Currently, includes pending protocol calls. In the future, we might add more info.

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

<span id="browsercontexts">[browserContexts()](./puppeteer.browser.browsercontexts.md)</span>

</td><td>

</td><td>

Gets a list of open [browser contexts](./puppeteer.browsercontext.md).

In a newly-created [browser](./puppeteer.browser.md), this will return a single instance of [BrowserContext](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="close">[close()](./puppeteer.browser.close.md)</span>

</td><td>

</td><td>

Closes this [browser](./puppeteer.browser.md) and all associated [pages](./puppeteer.page.md).

</td></tr>
<tr><td>

<span id="createbrowsercontext">[createBrowserContext(options)](./puppeteer.browser.createbrowsercontext.md)</span>

</td><td>

</td><td>

Creates a new [browser context](./puppeteer.browsercontext.md).

This won't share cookies/cache with other [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="defaultbrowsercontext">[defaultBrowserContext()](./puppeteer.browser.defaultbrowsercontext.md)</span>

</td><td>

</td><td>

Gets the default [browser context](./puppeteer.browsercontext.md).

**Remarks:**

The default [browser context](./puppeteer.browsercontext.md) cannot be closed.

</td></tr>
<tr><td>

<span id="disconnect">[disconnect()](./puppeteer.browser.disconnect.md)</span>

</td><td>

</td><td>

Disconnects Puppeteer from this [browser](./puppeteer.browser.md), but leaves the process running.

</td></tr>
<tr><td>

<span id="isconnected">[isConnected()](./puppeteer.browser.isconnected.md)</span>

</td><td>

`deprecated`

</td><td>

Whether Puppeteer is connected to this [browser](./puppeteer.browser.md).

**Deprecated:**

Use [Browser.connected](./puppeteer.browser.md).

</td></tr>
<tr><td>

<span id="newpage">[newPage()](./puppeteer.browser.newpage.md)</span>

</td><td>

</td><td>

Creates a new [page](./puppeteer.page.md) in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md).

</td></tr>
<tr><td>

<span id="pages">[pages()](./puppeteer.browser.pages.md)</span>

</td><td>

</td><td>

Gets a list of all open [pages](./puppeteer.page.md) inside this [Browser](./puppeteer.browser.md).

If there ar multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [pages](./puppeteer.page.md) in all [browser contexts](./puppeteer.browsercontext.md).

**Remarks:**

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).

</td></tr>
<tr><td>

<span id="process">[process()](./puppeteer.browser.process.md)</span>

</td><td>

</td><td>

Gets the associated [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess).

</td></tr>
<tr><td>

<span id="target">[target()](./puppeteer.browser.target.md)</span>

</td><td>

</td><td>

Gets the [target](./puppeteer.target.md) associated with the [default browser context](./puppeteer.browser.defaultbrowsercontext.md)).

</td></tr>
<tr><td>

<span id="targets">[targets()](./puppeteer.browser.targets.md)</span>

</td><td>

</td><td>

Gets all active [targets](./puppeteer.target.md).

In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="useragent">[userAgent()](./puppeteer.browser.useragent.md)</span>

</td><td>

</td><td>

Gets this [browser's](./puppeteer.browser.md) original user agent.

[Pages](./puppeteer.page.md) can override the user agent with [Page.setUserAgent()](./puppeteer.page.setuseragent.md).

</td></tr>
<tr><td>

<span id="version">[version()](./puppeteer.browser.version.md)</span>

</td><td>

</td><td>

Gets a string representing this [browser's](./puppeteer.browser.md) name and version.

For headless browser, this is similar to `"HeadlessChrome/61.0.3153.0"`. For non-headless or new-headless, this is similar to `"Chrome/61.0.3153.0"`. For Firefox, it is similar to `"Firefox/116.0a1"`.

The format of [Browser.version()](./puppeteer.browser.version.md) might change with future releases of browsers.

</td></tr>
<tr><td>

<span id="waitfortarget">[waitForTarget(predicate, options)](./puppeteer.browser.waitfortarget.md)</span>

</td><td>

</td><td>

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="wsendpoint">[wsEndpoint()](./puppeteer.browser.wsendpoint.md)</span>

</td><td>

</td><td>

Gets the WebSocket URL to connect to this [browser](./puppeteer.browser.md).

This is usually used with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

You can find the debugger URL (`webSocketDebuggerUrl`) from `http://HOST:PORT/json/version`.

See [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target) for more information.

**Remarks:**

The format is always `ws://HOST:PORT/devtools/browser/<id>`.

</td></tr>
</tbody></table>
