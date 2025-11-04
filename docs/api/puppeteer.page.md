---
sidebar_label: Page
---

# Page class

Page provides methods to interact with a single tab or [extension background page](https://developer.chrome.com/extensions/background_pages) in the browser.

:::note

One Browser instance might have multiple Page instances.

:::

### Signature

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

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.screenshot({path: 'screenshot.png'});
await browser.close();
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

<span id="accessibility">accessibility</span>

</td><td>

`readonly`

</td><td>

[Accessibility](./puppeteer.accessibility.md)

</td><td>

The Accessibility class provides methods for inspecting the browser's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

**Remarks:**

Accessibility is a very platform-specific thing. On different platforms, there are different screen readers that might have wildly different output.

Blink - Chrome's rendering engine - has a concept of "accessibility tree", which is then translated into different platform-specific APIs. Accessibility namespace gives users access to the Blink Accessibility Tree.

Most of the accessibility tree gets filtered out when converting from Blink AX Tree to Platform-specific AX-Tree or by assistive technologies themselves. By default, Puppeteer tries to approximate this filtering, exposing only the "interesting" nodes of the tree.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Accessibility` class.

</td></tr>
<tr><td>

<span id="coverage">coverage</span>

</td><td>

`readonly`

</td><td>

[Coverage](./puppeteer.coverage.md)

</td><td>

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

**Remarks:**

To output coverage in a form consumable by [Istanbul](https://github.com/istanbuljs), see [puppeteer-to-istanbul](https://github.com/istanbuljs/puppeteer-to-istanbul).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Coverage` class.

</td></tr>
<tr><td>

<span id="keyboard">keyboard</span>

</td><td>

`readonly`

</td><td>

[Keyboard](./puppeteer.keyboard.md)

</td><td>

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

**Remarks:**

For finer control, you can use [Keyboard.down()](./puppeteer.keyboard.down.md), [Keyboard.up()](./puppeteer.keyboard.up.md), and [Keyboard.sendCharacter()](./puppeteer.keyboard.sendcharacter.md) to manually fire events as if they were generated from a real keyboard.

On macOS, keyboard shortcuts like `⌘ A` -&gt; Select All do not work. See [\#1313](https://github.com/puppeteer/puppeteer/issues/1313).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Keyboard` class.

</td></tr>
<tr><td>

<span id="mouse">mouse</span>

</td><td>

`readonly`

</td><td>

[Mouse](./puppeteer.mouse.md)

</td><td>

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

**Remarks:**

Every `page` object has its own Mouse, accessible with [Page.mouse](./puppeteer.page.md#mouse).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Mouse` class.

</td></tr>
<tr><td>

<span id="touchscreen">touchscreen</span>

</td><td>

`readonly`

</td><td>

[Touchscreen](./puppeteer.touchscreen.md)

</td><td>

The Touchscreen class exposes touchscreen events.

</td></tr>
<tr><td>

<span id="tracing">tracing</span>

</td><td>

`readonly`

</td><td>

[Tracing](./puppeteer.tracing.md)

</td><td>

The Tracing class exposes the tracing audit interface.

**Remarks:**

You can use `tracing.start` and `tracing.stop` to create a trace file which can be opened in Chrome DevTools or [timeline viewer](https://chromedevtools.github.io/timeline-viewer/).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Tracing` class.

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

<span id="_">[$(selector)](./puppeteer.page._.md)</span>

</td><td>

</td><td>

Finds the first element that matches the selector. If no element matches the selector, the return value resolves to `null`.

**Remarks:**

Shortcut for [Page.mainFrame().$(selector)](./puppeteer.frame._.md).

</td></tr>
<tr><td>

<span id="__">[$$(selector, options)](./puppeteer.page.__.md)</span>

</td><td>

</td><td>

Finds elements on the page that match the selector. If no elements match the selector, the return value resolves to `[]`.

**Remarks:**

Shortcut for [Page.mainFrame().$$(selector)](./puppeteer.frame.__.md).

</td></tr>
<tr><td>

<span id="__eval">[$$eval(selector, pageFunction, args)](./puppeteer.page.__eval.md)</span>

</td><td>

</td><td>

This method returns all elements matching the selector and passes the resulting array as the first argument to the `pageFunction`.

**Remarks:**

If `pageFunction` returns a promise `$$eval` will wait for the promise to resolve and then return its value.

</td></tr>
<tr><td>

<span id="_eval">[$eval(selector, pageFunction, args)](./puppeteer.page._eval.md)</span>

</td><td>

</td><td>

This method finds the first element within the page that matches the selector and passes the result as the first argument to the `pageFunction`.

**Remarks:**

If no element is found matching `selector`, the method will throw an error.

If `pageFunction` returns a promise `$eval` will wait for the promise to resolve and then return its value.

</td></tr>
<tr><td>

<span id="addscripttag">[addScriptTag(options)](./puppeteer.page.addscripttag.md)</span>

</td><td>

</td><td>

Adds a `<script>` tag into the page with the desired URL or content.

**Remarks:**

Shortcut for [page.mainFrame().addScriptTag(options)](./puppeteer.frame.addscripttag.md).

</td></tr>
<tr><td>

<span id="addstyletag">[addStyleTag(options)](./puppeteer.page.addstyletag.md)</span>

</td><td>

</td><td>

Adds a `<link rel="stylesheet">` tag into the page with the desired URL or a `<style type="text/css">` tag with the content.

Shortcut for [page.mainFrame().addStyleTag(options)](./puppeteer.frame.addstyletag.md#overload-2).

</td></tr>
<tr><td>

<span id="addstyletag">[addStyleTag(options)](./puppeteer.page.addstyletag.md#overload-2)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="authenticate">[authenticate(credentials)](./puppeteer.page.authenticate.md)</span>

</td><td>

</td><td>

Provide credentials for `HTTP authentication`.

:::note

Request interception will be turned on behind the scenes to implement authentication. This might affect performance.

:::

**Remarks:**

To disable authentication, pass `null`.

</td></tr>
<tr><td>

<span id="bringtofront">[bringToFront()](./puppeteer.page.bringtofront.md)</span>

</td><td>

</td><td>

Brings page to front (activates tab).

</td></tr>
<tr><td>

<span id="browser">[browser()](./puppeteer.page.browser.md)</span>

</td><td>

</td><td>

Get the browser the page belongs to.

</td></tr>
<tr><td>

<span id="browsercontext">[browserContext()](./puppeteer.page.browsercontext.md)</span>

</td><td>

</td><td>

Get the browser context that the page belongs to.

</td></tr>
<tr><td>

<span id="click">[click(selector, options)](./puppeteer.page.click.md)</span>

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to click in the center of the element. If there's no element matching `selector`, the method throws an error.

**Remarks:**

Bear in mind that if `click()` triggers a navigation event and there's a separate `page.waitForNavigation()` promise to be resolved, you may end up with a race condition that yields unexpected results. The correct pattern for click and wait for navigation is the following:

```ts
const [response] = await Promise.all([
  page.waitForNavigation(waitOptions),
  page.click(selector, clickOptions),
]);
```

Shortcut for [page.mainFrame().click(selector\[, options\])](./puppeteer.frame.click.md).

</td></tr>
<tr><td>

<span id="close">[close(options)](./puppeteer.page.close.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="content">[content()](./puppeteer.page.content.md)</span>

</td><td>

</td><td>

The full HTML contents of the page, including the DOCTYPE.

</td></tr>
<tr><td>

<span id="cookies">[cookies(urls)](./puppeteer.page.cookies.md)</span>

</td><td>

`deprecated`

</td><td>

If no URLs are specified, this method returns cookies for the current page URL. If URLs are specified, only cookies for those URLs are returned.

**Deprecated:**

Page-level cookie API is deprecated. Use [Browser.cookies()](./puppeteer.browser.cookies.md) or [BrowserContext.cookies()](./puppeteer.browsercontext.cookies.md) instead.

</td></tr>
<tr><td>

<span id="createcdpsession">[createCDPSession()](./puppeteer.page.createcdpsession.md)</span>

</td><td>

</td><td>

Creates a Chrome Devtools Protocol session attached to the page.

</td></tr>
<tr><td>

<span id="createpdfstream">[createPDFStream(options)](./puppeteer.page.createpdfstream.md)</span>

</td><td>

</td><td>

Generates a PDF of the page with the `print` CSS media type.

**Remarks:**

To generate a PDF with the `screen` media type, call [\`page.emulateMediaType('screen')\`](./puppeteer.page.emulatemediatype.md) before calling `page.pdf()`.

By default, `page.pdf()` generates a pdf with modified colors for printing. Use the [\`-webkit-print-color-adjust\`](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust) property to force rendering of exact colors.

</td></tr>
<tr><td>

<span id="deletecookie">[deleteCookie(cookies)](./puppeteer.page.deletecookie.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Page-level cookie API is deprecated. Use [Browser.deleteCookie()](./puppeteer.browser.deletecookie.md), [BrowserContext.deleteCookie()](./puppeteer.browsercontext.deletecookie.md), [Browser.deleteMatchingCookies()](./puppeteer.browser.deletematchingcookies.md) or [BrowserContext.deleteMatchingCookies()](./puppeteer.browsercontext.deletematchingcookies.md) instead.

</td></tr>
<tr><td>

<span id="emulate">[emulate(device)](./puppeteer.page.emulate.md)</span>

</td><td>

</td><td>

Emulates a given device's metrics and user agent.

To aid emulation, Puppeteer provides a list of known devices that can be via [KnownDevices](./puppeteer.knowndevices.md).

**Remarks:**

This method is a shortcut for calling two methods: [Page.setUserAgent()](./puppeteer.page.setuseragent.md#overload-2) and [Page.setViewport()](./puppeteer.page.setviewport.md).

This method will resize the page. A lot of websites don't expect phones to change size, so you should emulate before navigating to the page.

</td></tr>
<tr><td>

<span id="emulatecputhrottling">[emulateCPUThrottling(factor)](./puppeteer.page.emulatecputhrottling.md)</span>

</td><td>

</td><td>

Enables CPU throttling to emulate slow CPUs.

</td></tr>
<tr><td>

<span id="emulateidlestate">[emulateIdleState(overrides)](./puppeteer.page.emulateidlestate.md)</span>

</td><td>

</td><td>

Emulates the idle state. If no arguments set, clears idle state emulation.

</td></tr>
<tr><td>

<span id="emulatemediafeatures">[emulateMediaFeatures(features)](./puppeteer.page.emulatemediafeatures.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="emulatemediatype">[emulateMediaType(type)](./puppeteer.page.emulatemediatype.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="emulatenetworkconditions">[emulateNetworkConditions(networkConditions)](./puppeteer.page.emulatenetworkconditions.md)</span>

</td><td>

</td><td>

This does not affect WebSockets and WebRTC PeerConnections (see https://crbug.com/563644). To set the page offline, you can use [Page.setOfflineMode()](./puppeteer.page.setofflinemode.md).

A list of predefined network conditions can be used by importing [PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md).

</td></tr>
<tr><td>

<span id="emulatetimezone">[emulateTimezone(timezoneId)](./puppeteer.page.emulatetimezone.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="emulatevisiondeficiency">[emulateVisionDeficiency(type)](./puppeteer.page.emulatevisiondeficiency.md)</span>

</td><td>

</td><td>

Simulates the given vision deficiency on the page.

</td></tr>
<tr><td>

<span id="evaluate">[evaluate(pageFunction, args)](./puppeteer.page.evaluate.md)</span>

</td><td>

</td><td>

Evaluates a function in the page's context and returns the result.

If the function passed to `page.evaluate` returns a Promise, the function will wait for the promise to resolve and return its value.

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(pageFunction, args)](./puppeteer.page.evaluatehandle.md)</span>

</td><td>

</td><td>

**Remarks:**

The only difference between [page.evaluate](./puppeteer.page.evaluate.md) and `page.evaluateHandle` is that `evaluateHandle` will return the value wrapped in an in-page object.

If the function passed to `page.evaluateHandle` returns a Promise, the function will wait for the promise to resolve and return its value.

You can pass a string instead of a function (although functions are recommended as they are easier to debug and use with TypeScript):

</td></tr>
<tr><td>

<span id="evaluateonnewdocument">[evaluateOnNewDocument(pageFunction, args)](./puppeteer.page.evaluateonnewdocument.md)</span>

</td><td>

</td><td>

Adds a function which would be invoked in one of the following scenarios:

- whenever the page is navigated

- whenever the child frame is attached or navigated. In this case, the function is invoked in the context of the newly attached frame.

The function is invoked after the document was created but before any of its scripts were run. This is useful to amend the JavaScript environment, e.g. to seed `Math.random`.

</td></tr>
<tr><td>

<span id="exposefunction">[exposeFunction(name, pptrFunction)](./puppeteer.page.exposefunction.md)</span>

</td><td>

</td><td>

The method adds a function called `name` on the page's `window` object. When called, the function executes `puppeteerFunction` in node.js and returns a `Promise` which resolves to the return value of `puppeteerFunction`.

If the puppeteerFunction returns a `Promise`, it will be awaited.

:::note

Functions installed via `page.exposeFunction` survive navigations.

:::

</td></tr>
<tr><td>

<span id="focus">[focus(selector)](./puppeteer.page.focus.md)</span>

</td><td>

</td><td>

This method fetches an element with `selector` and focuses it. If there's no element matching `selector`, the method throws an error.

**Remarks:**

Shortcut for [page.mainFrame().focus(selector)](./puppeteer.frame.focus.md).

</td></tr>
<tr><td>

<span id="frames">[frames()](./puppeteer.page.frames.md)</span>

</td><td>

</td><td>

An array of all frames attached to the page.

</td></tr>
<tr><td>

<span id="getdefaultnavigationtimeout">[getDefaultNavigationTimeout()](./puppeteer.page.getdefaultnavigationtimeout.md)</span>

</td><td>

</td><td>

Maximum navigation time in milliseconds.

</td></tr>
<tr><td>

<span id="getdefaulttimeout">[getDefaultTimeout()](./puppeteer.page.getdefaulttimeout.md)</span>

</td><td>

</td><td>

Maximum time in milliseconds.

</td></tr>
<tr><td>

<span id="goback">[goBack(options)](./puppeteer.page.goback.md)</span>

</td><td>

</td><td>

This method navigate to the previous page in history.

</td></tr>
<tr><td>

<span id="goforward">[goForward(options)](./puppeteer.page.goforward.md)</span>

</td><td>

</td><td>

This method navigate to the next page in history.

</td></tr>
<tr><td>

<span id="goto">[goto(url, options)](./puppeteer.page.goto.md)</span>

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

<span id="hover">[hover(selector)](./puppeteer.page.hover.md)</span>

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to hover over the center of the element. If there's no element matching `selector`, the method throws an error.

**Remarks:**

Shortcut for [page.mainFrame().hover(selector)](./puppeteer.page.hover.md).

</td></tr>
<tr><td>

<span id="isclosed">[isClosed()](./puppeteer.page.isclosed.md)</span>

</td><td>

</td><td>

Indicates that the page has been closed.

</td></tr>
<tr><td>

<span id="isdraginterceptionenabled">[isDragInterceptionEnabled()](./puppeteer.page.isdraginterceptionenabled.md)</span>

</td><td>

`deprecated`

</td><td>

`true` if drag events are being intercepted, `false` otherwise.

**Deprecated:**

We no longer support intercepting drag payloads. Use the new drag APIs found on [ElementHandle](./puppeteer.elementhandle.md) to drag (or just use the [Page.mouse](./puppeteer.page.md#mouse)).

</td></tr>
<tr><td>

<span id="isjavascriptenabled">[isJavaScriptEnabled()](./puppeteer.page.isjavascriptenabled.md)</span>

</td><td>

</td><td>

`true` if the page has JavaScript enabled, `false` otherwise.

</td></tr>
<tr><td>

<span id="isserviceworkerbypassed">[isServiceWorkerBypassed()](./puppeteer.page.isserviceworkerbypassed.md)</span>

</td><td>

</td><td>

`true` if the service worker are being bypassed, `false` otherwise.

</td></tr>
<tr><td>

<span id="locator">[locator(selector)](./puppeteer.page.locator.md)</span>

</td><td>

</td><td>

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

<span id="locator">[locator(func)](./puppeteer.page.locator.md#overload-2)</span>

</td><td>

</td><td>

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

</td></tr>
<tr><td>

<span id="mainframe">[mainFrame()](./puppeteer.page.mainframe.md)</span>

</td><td>

</td><td>

The page's main frame.

</td></tr>
<tr><td>

<span id="metrics">[metrics()](./puppeteer.page.metrics.md)</span>

</td><td>

</td><td>

Object containing metrics as key/value pairs.

**Remarks:**

All timestamps are in monotonic time: monotonically increasing time in seconds since an arbitrary point in the past.

</td></tr>
<tr><td>

<span id="opendevtools">[openDevTools()](./puppeteer.page.opendevtools.md)</span>

</td><td>

</td><td>

Opens DevTools for the current Page and returns the DevTools Page. This method is only available in Chrome.

</td></tr>
<tr><td>

<span id="pdf">[pdf(options)](./puppeteer.page.pdf.md)</span>

</td><td>

</td><td>

Generates a PDF of the page with the `print` CSS media type.

**Remarks:**

To generate a PDF with the `screen` media type, call [\`page.emulateMediaType('screen')\`](./puppeteer.page.emulatemediatype.md) before calling `page.pdf()`.

By default, `page.pdf()` generates a pdf with modified colors for printing. Use the [\`-webkit-print-color-adjust\`](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust) property to force rendering of exact colors.

</td></tr>
<tr><td>

<span id="queryobjects">[queryObjects(prototypeHandle)](./puppeteer.page.queryobjects.md)</span>

</td><td>

</td><td>

This method iterates the JavaScript heap and finds all objects with the given prototype.

</td></tr>
<tr><td>

<span id="reload">[reload(options)](./puppeteer.page.reload.md)</span>

</td><td>

</td><td>

Reloads the page.

</td></tr>
<tr><td>

<span id="removeexposedfunction">[removeExposedFunction(name)](./puppeteer.page.removeexposedfunction.md)</span>

</td><td>

</td><td>

The method removes a previously added function via $[Page.exposeFunction()](./puppeteer.page.exposefunction.md) called `name` from the page's `window` object.

</td></tr>
<tr><td>

<span id="removescripttoevaluateonnewdocument">[removeScriptToEvaluateOnNewDocument(identifier)](./puppeteer.page.removescripttoevaluateonnewdocument.md)</span>

</td><td>

</td><td>

Removes script that injected into page by Page.evaluateOnNewDocument.

</td></tr>
<tr><td>

<span id="screencast">[screencast(options)](./puppeteer.page.screencast.md)</span>

</td><td>

</td><td>

**_(Experimental)_** Captures a screencast of this [page](./puppeteer.page.md).

**Remarks:**

By default, all recordings will be [WebM](https://www.webmproject.org/) format using the [VP9](https://www.webmproject.org/vp9/) video codec, with a frame rate of 30 FPS.

You must have [ffmpeg](https://ffmpeg.org/) installed on your system.

</td></tr>
<tr><td>

<span id="screenshot">[screenshot(options)](./puppeteer.page.screenshot.md)</span>

</td><td>

</td><td>

Captures a screenshot of this [page](./puppeteer.page.md).

**Remarks:**

While a screenshot is being taken in a [BrowserContext](./puppeteer.browsercontext.md), the following methods will automatically wait for the screenshot to finish to prevent interference with the screenshot process: [BrowserContext.newPage()](./puppeteer.browsercontext.newpage.md), [Browser.newPage()](./puppeteer.browser.newpage.md), [Page.close()](./puppeteer.page.close.md).

Calling [Page.bringToFront()](./puppeteer.page.bringtofront.md) will not wait for existing screenshot operations.

</td></tr>
<tr><td>

<span id="screenshot">[screenshot(options)](./puppeteer.page.screenshot.md#overload-2)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="select">[select(selector, values)](./puppeteer.page.select.md)</span>

</td><td>

</td><td>

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

**Remarks:**

Shortcut for [page.mainFrame().select()](./puppeteer.frame.select.md)

</td></tr>
<tr><td>

<span id="setbypasscsp">[setBypassCSP(enabled)](./puppeteer.page.setbypasscsp.md)</span>

</td><td>

</td><td>

Toggles bypassing page's Content-Security-Policy.

**Remarks:**

NOTE: CSP bypassing happens at the moment of CSP initialization rather than evaluation. Usually, this means that `page.setBypassCSP` should be called before navigating to the domain.

</td></tr>
<tr><td>

<span id="setbypassserviceworker">[setBypassServiceWorker(bypass)](./puppeteer.page.setbypassserviceworker.md)</span>

</td><td>

</td><td>

Toggles ignoring of service worker for each request.

</td></tr>
<tr><td>

<span id="setcacheenabled">[setCacheEnabled(enabled)](./puppeteer.page.setcacheenabled.md)</span>

</td><td>

</td><td>

Toggles ignoring cache for each request based on the enabled state. By default, caching is enabled.

</td></tr>
<tr><td>

<span id="setcontent">[setContent(html, options)](./puppeteer.page.setcontent.md)</span>

</td><td>

</td><td>

Set the content of the page.

</td></tr>
<tr><td>

<span id="setcookie">[setCookie(cookies)](./puppeteer.page.setcookie.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Page-level cookie API is deprecated. Use [Browser.setCookie()](./puppeteer.browser.setcookie.md) or [BrowserContext.setCookie()](./puppeteer.browsercontext.setcookie.md) instead.

</td></tr>
<tr><td>

<span id="setdefaultnavigationtimeout">[setDefaultNavigationTimeout(timeout)](./puppeteer.page.setdefaultnavigationtimeout.md)</span>

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

<span id="setdefaulttimeout">[setDefaultTimeout(timeout)](./puppeteer.page.setdefaulttimeout.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="setdraginterception">[setDragInterception(enabled)](./puppeteer.page.setdraginterception.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

We no longer support intercepting drag payloads. Use the new drag APIs found on [ElementHandle](./puppeteer.elementhandle.md) to drag (or just use the [Page.mouse](./puppeteer.page.md#mouse)).

</td></tr>
<tr><td>

<span id="setextrahttpheaders">[setExtraHTTPHeaders(headers)](./puppeteer.page.setextrahttpheaders.md)</span>

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

<span id="setgeolocation">[setGeolocation(options)](./puppeteer.page.setgeolocation.md)</span>

</td><td>

</td><td>

Sets the page's geolocation.

**Remarks:**

Consider using [BrowserContext.overridePermissions()](./puppeteer.browsercontext.overridepermissions.md) to grant permissions for the page to read its geolocation.

</td></tr>
<tr><td>

<span id="setjavascriptenabled">[setJavaScriptEnabled(enabled)](./puppeteer.page.setjavascriptenabled.md)</span>

</td><td>

</td><td>

**Remarks:**

NOTE: changing this value won't affect scripts that have already been run. It will take full effect on the next navigation.

</td></tr>
<tr><td>

<span id="setofflinemode">[setOfflineMode(enabled)](./puppeteer.page.setofflinemode.md)</span>

</td><td>

</td><td>

Emulates the offline mode.

It does not change the download/upload/latency parameters set by [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md)

</td></tr>
<tr><td>

<span id="setrequestinterception">[setRequestInterception(value)](./puppeteer.page.setrequestinterception.md)</span>

</td><td>

</td><td>

Activating request interception enables [HTTPRequest.abort()](./puppeteer.httprequest.abort.md), [HTTPRequest.continue()](./puppeteer.httprequest.continue.md) and [HTTPRequest.respond()](./puppeteer.httprequest.respond.md) methods. This provides the capability to modify network requests that are made by a page.

Once request interception is enabled, every request will stall unless it's continued, responded or aborted; or completed using the browser cache.

See the [Request interception guide](https://pptr.dev/guides/network-interception) for more details.

</td></tr>
<tr><td>

<span id="setuseragent">[setUserAgent(userAgent, userAgentMetadata)](./puppeteer.page.setuseragent.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Use [Page.setUserAgent()](./puppeteer.page.setuseragent.md#overload-2) instead.

</td></tr>
<tr><td>

<span id="setuseragent">[setUserAgent(options)](./puppeteer.page.setuseragent.md#overload-2)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="setviewport">[setViewport(viewport)](./puppeteer.page.setviewport.md)</span>

</td><td>

</td><td>

`page.setViewport` will resize the page. A lot of websites don't expect phones to change size, so you should set the viewport before navigating to the page.

In the case of multiple pages in a single browser, each page can have its own viewport size. Setting the viewport to `null` resets the viewport to its default value.

**Remarks:**

NOTE: in certain cases, setting viewport will reload the page in order to set the isMobile or hasTouch properties.

</td></tr>
<tr><td>

<span id="tap">[tap(selector)](./puppeteer.page.tap.md)</span>

</td><td>

</td><td>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.md#touchscreen) to tap in the center of the element. If there's no element matching `selector`, the method throws an error.

**Remarks:**

Shortcut for [page.mainFrame().tap(selector)](./puppeteer.frame.tap.md).

</td></tr>
<tr><td>

<span id="target">[target()](./puppeteer.page.target.md)</span>

</td><td>

`deprecated`

</td><td>

A target this page was created from.

**Deprecated:**

Use [Page.createCDPSession()](./puppeteer.page.createcdpsession.md) directly.

</td></tr>
<tr><td>

<span id="title">[title()](./puppeteer.page.title.md)</span>

</td><td>

</td><td>

The page's title

**Remarks:**

Shortcut for [page.mainFrame().title()](./puppeteer.frame.title.md).

</td></tr>
<tr><td>

<span id="type">[type(selector, text, options)](./puppeteer.page.type.md)</span>

</td><td>

</td><td>

Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.page.url.md)</span>

</td><td>

</td><td>

The page's URL.

**Remarks:**

Shortcut for [page.mainFrame().url()](./puppeteer.frame.url.md).

</td></tr>
<tr><td>

<span id="viewport">[viewport()](./puppeteer.page.viewport.md)</span>

</td><td>

</td><td>

Returns the current page viewport settings without checking the actual page viewport.

This is either the viewport set with the previous [Page.setViewport()](./puppeteer.page.setviewport.md) call or the default viewport set via [ConnectOptions.defaultViewport](./puppeteer.connectoptions.md#defaultviewport).

</td></tr>
<tr><td>

<span id="waitfordeviceprompt">[waitForDevicePrompt(options)](./puppeteer.page.waitfordeviceprompt.md)</span>

</td><td>

</td><td>

This method is typically coupled with an action that triggers a device request from an api such as WebBluetooth.

:::caution

This must be called before the device request is made. It will not return a currently active device prompt.

:::

</td></tr>
<tr><td>

<span id="waitforfilechooser">[waitForFileChooser(options)](./puppeteer.page.waitforfilechooser.md)</span>

</td><td>

</td><td>

This method is typically coupled with an action that triggers file choosing.

:::caution

This must be called before the file chooser is launched. It will not return a currently active file chooser.

:::

:::caution

Interception of file dialogs triggered via DOM APIs such as window.showOpenFilePicker is currently not supported.

:::

**Remarks:**

In the "headful" browser, this method results in the native file picker dialog `not showing up` for the user.

</td></tr>
<tr><td>

<span id="waitforframe">[waitForFrame(urlOrPredicate, options)](./puppeteer.page.waitforframe.md)</span>

</td><td>

</td><td>

Waits for a frame matching the given conditions to appear.

</td></tr>
<tr><td>

<span id="waitforfunction">[waitForFunction(pageFunction, options, args)](./puppeteer.page.waitforfunction.md)</span>

</td><td>

</td><td>

Waits for the provided function, `pageFunction`, to return a truthy value when evaluated in the page's context.

</td></tr>
<tr><td>

<span id="waitfornavigation">[waitForNavigation(options)](./puppeteer.page.waitfornavigation.md)</span>

</td><td>

</td><td>

Waits for the page to navigate to a new URL or to reload. It is useful when you run code that will indirectly cause the page to navigate.

**Remarks:**

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

</td></tr>
<tr><td>

<span id="waitfornetworkidle">[waitForNetworkIdle(options)](./puppeteer.page.waitfornetworkidle.md)</span>

</td><td>

</td><td>

Waits for the network to be idle.

**Remarks:**

The function will always wait at least the set [IdleTime](./puppeteer.waitfornetworkidleoptions.md#idletime).

</td></tr>
<tr><td>

<span id="waitforrequest">[waitForRequest(urlOrPredicate, options)](./puppeteer.page.waitforrequest.md)</span>

</td><td>

</td><td>

**Remarks:**

Optional Waiting Parameters have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

</td></tr>
<tr><td>

<span id="waitforresponse">[waitForResponse(urlOrPredicate, options)](./puppeteer.page.waitforresponse.md)</span>

</td><td>

</td><td>

**Remarks:**

Optional Parameter have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

</td></tr>
<tr><td>

<span id="waitforselector">[waitForSelector(selector, options)](./puppeteer.page.waitforselector.md)</span>

</td><td>

</td><td>

Wait for the `selector` to appear in page. If at the moment of calling the method the `selector` already exists, the method will return immediately. If the `selector` doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

**Remarks:**

The optional Parameter in Arguments `options` are:

- `visible`: A boolean wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `hidden`: Wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `timeout`: maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

</td></tr>
<tr><td>

<span id="workers">[workers()](./puppeteer.page.workers.md)</span>

</td><td>

</td><td>

All of the dedicated [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) associated with the page.

**Remarks:**

This does not contain ServiceWorkers

</td></tr>
</tbody></table>
