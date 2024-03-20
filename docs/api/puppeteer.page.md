---
sidebar_label: Page
---

# Page class

Page provides methods to interact with a single tab or [extension background page](https://developer.chrome.com/extensions/background_pages) in the browser.

:::note

One Browser instance might have multiple Page instances.

:::

#### Signature:

```typescript
export declare abstract class Page extends EventEmitter<PageEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[PageEvents](./puppeteer.pageevents.md)&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Page` class.

## Example 1

This example creates a page, navigates it to a URL, and then saves a screenshot:

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'screenshot.png'});
  await browser.close();
})();
```

The Page class extends from Puppeteer's [EventEmitter](./puppeteer.eventemitter.md) class and will emit various events which are documented in the [PageEvent](./puppeteer.pageevent.md) enum.

## Example 2

This example logs a message for a single page `load` event:

```ts
page.once('load', () => console.log('Page loaded!'));
```

To unsubscribe from events use the [EventEmitter.off()](./puppeteer.eventemitter.off.md) method:

```ts
function logRequest(interceptedRequest) {
  console.log('A request was made:', interceptedRequest.url());
}
page.on('request', logRequest);
// Sometime later...
page.off('request', logRequest);
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

accessibility

</td><td>

`readonly`

</td><td>

[Accessibility](./puppeteer.accessibility.md)

</td><td>

The Accessibility class provides methods for inspecting the browser's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

</td></tr>
<tr><td>

coverage

</td><td>

`readonly`

</td><td>

[Coverage](./puppeteer.coverage.md)

</td><td>

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

</td></tr>
<tr><td>

keyboard

</td><td>

`readonly`

</td><td>

[Keyboard](./puppeteer.keyboard.md)

</td><td>

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

</td></tr>
<tr><td>

mouse

</td><td>

`readonly`

</td><td>

[Mouse](./puppeteer.mouse.md)

</td><td>

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

</td></tr>
<tr><td>

touchscreen

</td><td>

`readonly`

</td><td>

[Touchscreen](./puppeteer.touchscreen.md)

</td><td>

The Touchscreen class exposes touchscreen events.

</td></tr>
<tr><td>

tracing

</td><td>

`readonly`

</td><td>

[Tracing](./puppeteer.tracing.md)

</td><td>

The Tracing class exposes the tracing audit interface.

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

[$(selector)](./puppeteer.page._.md)

</td><td>

</td><td>

Runs `document.querySelector` within the page. If no element matches the selector, the return value resolves to `null`.

</td></tr>
<tr><td>

[$$(selector)](./puppeteer.page.__.md)

</td><td>

</td><td>

The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolves to `[]`.

</td></tr>
<tr><td>

[$$eval(selector, pageFunction, args)](./puppeteer.page.__eval.md)

</td><td>

</td><td>

This method runs `Array.from(document.querySelectorAll(selector))` within the page and passes the result as the first argument to the `pageFunction`.

</td></tr>
<tr><td>

[$eval(selector, pageFunction, args)](./puppeteer.page._eval.md)

</td><td>

</td><td>

This method runs `document.querySelector` within the page and passes the result as the first argument to the `pageFunction`.

</td></tr>
<tr><td>

[addScriptTag(options)](./puppeteer.page.addscripttag.md)

</td><td>

</td><td>

Adds a `<script>` tag into the page with the desired URL or content.

</td></tr>
<tr><td>

[addStyleTag(options)](./puppeteer.page.addstyletag.md)

</td><td>

</td><td>

Adds a `<link rel="stylesheet">` tag into the page with the desired URL or a `<style type="text/css">` tag with the content.

Shortcut for [page.mainFrame().addStyleTag(options)](./puppeteer.frame.addstyletag_1.md).

</td></tr>
<tr><td>

[addStyleTag(options)](./puppeteer.page.addstyletag_1.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[authenticate(credentials)](./puppeteer.page.authenticate.md)

</td><td>

</td><td>

Provide credentials for `HTTP authentication`.

</td></tr>
<tr><td>

[bringToFront()](./puppeteer.page.bringtofront.md)

</td><td>

</td><td>

Brings page to front (activates tab).

</td></tr>
<tr><td>

[browser()](./puppeteer.page.browser.md)

</td><td>

</td><td>

Get the browser the page belongs to.

</td></tr>
<tr><td>

[browserContext()](./puppeteer.page.browsercontext.md)

</td><td>

</td><td>

Get the browser context that the page belongs to.

</td></tr>
<tr><td>

[click(selector, options)](./puppeteer.page.click.md)

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to click in the center of the element. If there's no element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[close(options)](./puppeteer.page.close.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[content()](./puppeteer.page.content.md)

</td><td>

</td><td>

The full HTML contents of the page, including the DOCTYPE.

</td></tr>
<tr><td>

[cookies(urls)](./puppeteer.page.cookies.md)

</td><td>

</td><td>

If no URLs are specified, this method returns cookies for the current page URL. If URLs are specified, only cookies for those URLs are returned.

</td></tr>
<tr><td>

[createCDPSession()](./puppeteer.page.createcdpsession.md)

</td><td>

</td><td>

Creates a Chrome Devtools Protocol session attached to the page.

</td></tr>
<tr><td>

[createPDFStream(options)](./puppeteer.page.createpdfstream.md)

</td><td>

</td><td>

Generates a PDF of the page with the `print` CSS media type.

</td></tr>
<tr><td>

[deleteCookie(cookies)](./puppeteer.page.deletecookie.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[emulate(device)](./puppeteer.page.emulate.md)

</td><td>

</td><td>

Emulates a given device's metrics and user agent.

To aid emulation, Puppeteer provides a list of known devices that can be via [KnownDevices](./puppeteer.knowndevices.md).

</td></tr>
<tr><td>

[emulateCPUThrottling(factor)](./puppeteer.page.emulatecputhrottling.md)

</td><td>

</td><td>

Enables CPU throttling to emulate slow CPUs.

</td></tr>
<tr><td>

[emulateIdleState(overrides)](./puppeteer.page.emulateidlestate.md)

</td><td>

</td><td>

Emulates the idle state. If no arguments set, clears idle state emulation.

</td></tr>
<tr><td>

[emulateMediaFeatures(features)](./puppeteer.page.emulatemediafeatures.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[emulateMediaType(type)](./puppeteer.page.emulatemediatype.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[emulateNetworkConditions(networkConditions)](./puppeteer.page.emulatenetworkconditions.md)

</td><td>

</td><td>

This does not affect WebSockets and WebRTC PeerConnections (see https://crbug.com/563644). To set the page offline, you can use [Page.setOfflineMode()](./puppeteer.page.setofflinemode.md).

A list of predefined network conditions can be used by importing [PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md).

</td></tr>
<tr><td>

[emulateTimezone(timezoneId)](./puppeteer.page.emulatetimezone.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[emulateVisionDeficiency(type)](./puppeteer.page.emulatevisiondeficiency.md)

</td><td>

</td><td>

Simulates the given vision deficiency on the page.

</td></tr>
<tr><td>

[evaluate(pageFunction, args)](./puppeteer.page.evaluate.md)

</td><td>

</td><td>

Evaluates a function in the page's context and returns the result.

If the function passed to `page.evaluate` returns a Promise, the function will wait for the promise to resolve and return its value.

</td></tr>
<tr><td>

[evaluateHandle(pageFunction, args)](./puppeteer.page.evaluatehandle.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[evaluateOnNewDocument(pageFunction, args)](./puppeteer.page.evaluateonnewdocument.md)

</td><td>

</td><td>

Adds a function which would be invoked in one of the following scenarios:

- whenever the page is navigated

- whenever the child frame is attached or navigated. In this case, the function is invoked in the context of the newly attached frame.

The function is invoked after the document was created but before any of its scripts were run. This is useful to amend the JavaScript environment, e.g. to seed `Math.random`.

</td></tr>
<tr><td>

[exposeFunction(name, pptrFunction)](./puppeteer.page.exposefunction.md)

</td><td>

</td><td>

The method adds a function called `name` on the page's `window` object. When called, the function executes `puppeteerFunction` in node.js and returns a `Promise` which resolves to the return value of `puppeteerFunction`.

If the puppeteerFunction returns a `Promise`, it will be awaited.

:::note

Functions installed via `page.exposeFunction` survive navigations.

:::

</td></tr>
<tr><td>

[focus(selector)](./puppeteer.page.focus.md)

</td><td>

</td><td>

This method fetches an element with `selector` and focuses it. If there's no element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[frames()](./puppeteer.page.frames.md)

</td><td>

</td><td>

An array of all frames attached to the page.

</td></tr>
<tr><td>

[getDefaultTimeout()](./puppeteer.page.getdefaulttimeout.md)

</td><td>

</td><td>

Maximum time in milliseconds.

</td></tr>
<tr><td>

[goBack(options)](./puppeteer.page.goback.md)

</td><td>

</td><td>

This method navigate to the previous page in history.

</td></tr>
<tr><td>

[goForward(options)](./puppeteer.page.goforward.md)

</td><td>

</td><td>

This method navigate to the next page in history.

</td></tr>
<tr><td>

[goto(url, options)](./puppeteer.page.goto.md)

</td><td>

</td><td>

Navigates the page to the given `url`.

</td></tr>
<tr><td>

[hover(selector)](./puppeteer.page.hover.md)

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to hover over the center of the element. If there's no element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[isClosed()](./puppeteer.page.isclosed.md)

</td><td>

</td><td>

Indicates that the page has been closed.

</td></tr>
<tr><td>

[isDragInterceptionEnabled()](./puppeteer.page.isdraginterceptionenabled.md)

</td><td>

</td><td>

`true` if drag events are being intercepted, `false` otherwise.

</td></tr>
<tr><td>

[isJavaScriptEnabled()](./puppeteer.page.isjavascriptenabled.md)

</td><td>

</td><td>

`true` if the page has JavaScript enabled, `false` otherwise.

</td></tr>
<tr><td>

[isServiceWorkerBypassed()](./puppeteer.page.isserviceworkerbypassed.md)

</td><td>

</td><td>

`true` if the service worker are being bypassed, `false` otherwise.

</td></tr>
<tr><td>

[locator(selector)](./puppeteer.page.locator.md)

</td><td>

</td><td>

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

[locator(func)](./puppeteer.page.locator_1.md)

</td><td>

</td><td>

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

[mainFrame()](./puppeteer.page.mainframe.md)

</td><td>

</td><td>

The page's main frame.

</td></tr>
<tr><td>

[metrics()](./puppeteer.page.metrics.md)

</td><td>

</td><td>

Object containing metrics as key/value pairs.

</td></tr>
<tr><td>

[pdf(options)](./puppeteer.page.pdf.md)

</td><td>

</td><td>

Generates a PDF of the page with the `print` CSS media type.

</td></tr>
<tr><td>

[queryObjects(prototypeHandle)](./puppeteer.page.queryobjects.md)

</td><td>

</td><td>

This method iterates the JavaScript heap and finds all objects with the given prototype.

</td></tr>
<tr><td>

[reload(options)](./puppeteer.page.reload.md)

</td><td>

</td><td>

Reloads the page.

</td></tr>
<tr><td>

[removeExposedFunction(name)](./puppeteer.page.removeexposedfunction.md)

</td><td>

</td><td>

The method removes a previously added function via $[Page.exposeFunction()](./puppeteer.page.exposefunction.md) called `name` from the page's `window` object.

</td></tr>
<tr><td>

[removeScriptToEvaluateOnNewDocument(identifier)](./puppeteer.page.removescripttoevaluateonnewdocument.md)

</td><td>

</td><td>

Removes script that injected into page by Page.evaluateOnNewDocument.

</td></tr>
<tr><td>

[screencast(options)](./puppeteer.page.screencast.md)

</td><td>

</td><td>

Captures a screencast of this [page](./puppeteer.page.md).

</td></tr>
<tr><td>

[screenshot(options)](./puppeteer.page.screenshot.md)

</td><td>

</td><td>

Captures a screenshot of this [page](./puppeteer.page.md).

</td></tr>
<tr><td>

[screenshot(options)](./puppeteer.page.screenshot_1.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[select(selector, values)](./puppeteer.page.select.md)

</td><td>

</td><td>

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[setBypassCSP(enabled)](./puppeteer.page.setbypasscsp.md)

</td><td>

</td><td>

Toggles bypassing page's Content-Security-Policy.

</td></tr>
<tr><td>

[setBypassServiceWorker(bypass)](./puppeteer.page.setbypassserviceworker.md)

</td><td>

</td><td>

Toggles ignoring of service worker for each request.

</td></tr>
<tr><td>

[setCacheEnabled(enabled)](./puppeteer.page.setcacheenabled.md)

</td><td>

</td><td>

Toggles ignoring cache for each request based on the enabled state. By default, caching is enabled.

</td></tr>
<tr><td>

[setContent(html, options)](./puppeteer.page.setcontent.md)

</td><td>

</td><td>

Set the content of the page.

</td></tr>
<tr><td>

[setCookie(cookies)](./puppeteer.page.setcookie.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setDefaultNavigationTimeout(timeout)](./puppeteer.page.setdefaultnavigationtimeout.md)

</td><td>

</td><td>

This setting will change the default maximum navigation time for the following methods and related shortcuts:

- [page.goBack(options)](./puppeteer.page.goback.md)

- [page.goForward(options)](./puppeteer.page.goforward.md)

- [page.goto(url,options)](./puppeteer.page.goto.md)

- [page.reload(options)](./puppeteer.page.reload.md)

- [page.setContent(html,options)](./puppeteer.page.setcontent.md)

- [page.waitForNavigation(options)](./puppeteer.page.waitfornavigation.md)

</td></tr>
<tr><td>

[setDefaultTimeout(timeout)](./puppeteer.page.setdefaulttimeout.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setDragInterception(enabled)](./puppeteer.page.setdraginterception.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setExtraHTTPHeaders(headers)](./puppeteer.page.setextrahttpheaders.md)

</td><td>

</td><td>

The extra HTTP headers will be sent with every request the page initiates.

:::tip

All HTTP header names are lowercased. (HTTP headers are case-insensitive, so this shouldn’t impact your server code.)

:::

:::note

page.setExtraHTTPHeaders does not guarantee the order of headers in the outgoing requests.

:::

</td></tr>
<tr><td>

[setGeolocation(options)](./puppeteer.page.setgeolocation.md)

</td><td>

</td><td>

Sets the page's geolocation.

</td></tr>
<tr><td>

[setJavaScriptEnabled(enabled)](./puppeteer.page.setjavascriptenabled.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setOfflineMode(enabled)](./puppeteer.page.setofflinemode.md)

</td><td>

</td><td>

Sets the network connection to offline.

It does not change the parameters used in [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md)

</td></tr>
<tr><td>

[setRequestInterception(value)](./puppeteer.page.setrequestinterception.md)

</td><td>

</td><td>

Activating request interception enables [HTTPRequest.abort()](./puppeteer.httprequest.abort.md), [HTTPRequest.continue()](./puppeteer.httprequest.continue.md) and [HTTPRequest.respond()](./puppeteer.httprequest.respond.md) methods. This provides the capability to modify network requests that are made by a page.

Once request interception is enabled, every request will stall unless it's continued, responded or aborted; or completed using the browser cache.

See the [Request interception guide](https://pptr.dev/next/guides/request-interception) for more details.

</td></tr>
<tr><td>

[setUserAgent(userAgent, userAgentMetadata)](./puppeteer.page.setuseragent.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setViewport(viewport)](./puppeteer.page.setviewport.md)

</td><td>

</td><td>

`page.setViewport` will resize the page. A lot of websites don't expect phones to change size, so you should set the viewport before navigating to the page.

In the case of multiple pages in a single browser, each page can have its own viewport size.

</td></tr>
<tr><td>

[tap(selector)](./puppeteer.page.tap.md)

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.md) to tap in the center of the element. If there's no element matching `selector`, the method throws an error.

</td></tr>
<tr><td>

[target()](./puppeteer.page.target.md)

</td><td>

</td><td>

A target this page was created from.

</td></tr>
<tr><td>

[title()](./puppeteer.page.title.md)

</td><td>

</td><td>

The page's title

</td></tr>
<tr><td>

[type(selector, text, options)](./puppeteer.page.type.md)

</td><td>

</td><td>

Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

</td></tr>
<tr><td>

[url()](./puppeteer.page.url.md)

</td><td>

</td><td>

The page's URL.

</td></tr>
<tr><td>

[viewport()](./puppeteer.page.viewport.md)

</td><td>

</td><td>

Returns the current page viewport settings without checking the actual page viewport.

This is either the viewport set with the previous [Page.setViewport()](./puppeteer.page.setviewport.md) call or the default viewport set via [BrowserConnectOptions.defaultViewport](./puppeteer.browserconnectoptions.md).

</td></tr>
<tr><td>

[waitForDevicePrompt(options)](./puppeteer.page.waitfordeviceprompt.md)

</td><td>

</td><td>

This method is typically coupled with an action that triggers a device request from an api such as WebBluetooth.

:::caution

This must be called before the device request is made. It will not return a currently active device prompt.

:::

</td></tr>
<tr><td>

[waitForFileChooser(options)](./puppeteer.page.waitforfilechooser.md)

</td><td>

</td><td>

This method is typically coupled with an action that triggers file choosing.

:::caution

This must be called before the file chooser is launched. It will not return a currently active file chooser.

:::

</td></tr>
<tr><td>

[waitForFrame(urlOrPredicate, options)](./puppeteer.page.waitforframe.md)

</td><td>

</td><td>

Waits for a frame matching the given conditions to appear.

</td></tr>
<tr><td>

[waitForFunction(pageFunction, options, args)](./puppeteer.page.waitforfunction.md)

</td><td>

</td><td>

Waits for the provided function, `pageFunction`, to return a truthy value when evaluated in the page's context.

</td></tr>
<tr><td>

[waitForNavigation(options)](./puppeteer.page.waitfornavigation.md)

</td><td>

</td><td>

Waits for the page to navigate to a new URL or to reload. It is useful when you run code that will indirectly cause the page to navigate.

</td></tr>
<tr><td>

[waitForNetworkIdle(options)](./puppeteer.page.waitfornetworkidle.md)

</td><td>

</td><td>

Waits for the network to be idle.

</td></tr>
<tr><td>

[waitForRequest(urlOrPredicate, options)](./puppeteer.page.waitforrequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[waitForResponse(urlOrPredicate, options)](./puppeteer.page.waitforresponse.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[waitForSelector(selector, options)](./puppeteer.page.waitforselector.md)

</td><td>

</td><td>

Wait for the `selector` to appear in page. If at the moment of calling the method the `selector` already exists, the method will return immediately. If the `selector` doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

</td></tr>
<tr><td>

[workers()](./puppeteer.page.workers.md)

</td><td>

</td><td>

All of the dedicated [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) associated with the page.

</td></tr>
</tbody></table>
