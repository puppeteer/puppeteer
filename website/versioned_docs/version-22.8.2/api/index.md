---
sidebar_label: API
---

# API Reference

## Classes

<table><thead><tr><th>

Class

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="accessibility">[Accessibility](./puppeteer.accessibility.md)</span>

</td><td>

The Accessibility class provides methods for inspecting the browser's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

**Remarks:**

Accessibility is a very platform-specific thing. On different platforms, there are different screen readers that might have wildly different output.

Blink - Chrome's rendering engine - has a concept of "accessibility tree", which is then translated into different platform-specific APIs. Accessibility namespace gives users access to the Blink Accessibility Tree.

Most of the accessibility tree gets filtered out when converting from Blink AX Tree to Platform-specific AX-Tree or by assistive technologies themselves. By default, Puppeteer tries to approximate this filtering, exposing only the "interesting" nodes of the tree.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Accessibility` class.

</td></tr>
<tr><td>

<span id="browser">[Browser](./puppeteer.browser.md)</span>

</td><td>

[Browser](./puppeteer.browser.md) represents a browser instance that is either:

- connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) or - launched by [PuppeteerNode.launch()](./puppeteer.puppeteernode.launch.md).

[Browser](./puppeteer.browser.md) [emits](./puppeteer.eventemitter.emit.md) various events which are documented in the [BrowserEvent](./puppeteer.browserevent.md) enum.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Browser` class.

</td></tr>
<tr><td>

<span id="browsercontext">[BrowserContext](./puppeteer.browsercontext.md)</span>

</td><td>

[BrowserContext](./puppeteer.browsercontext.md) represents individual user contexts within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has a single [browser context](./puppeteer.browsercontext.md) by default. Others can be created using [Browser.createBrowserContext()](./puppeteer.browser.createbrowsercontext.md). Each context has isolated storage (cookies/localStorage/etc.)

[BrowserContext](./puppeteer.browsercontext.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserContextEvent](./puppeteer.browsercontextevent.md) enum.

If a [page](./puppeteer.page.md) opens another [page](./puppeteer.page.md), e.g. using `window.open`, the popup will belong to the parent [page's browser context](./puppeteer.page.browsercontext.md).

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `BrowserContext` class.

</td></tr>
<tr><td>

<span id="cdpsession">[CDPSession](./puppeteer.cdpsession.md)</span>

</td><td>

The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.

**Remarks:**

Protocol methods can be called with [CDPSession.send()](./puppeteer.cdpsession.send.md) method and protocol events can be subscribed to with `CDPSession.on` method.

Useful links: [DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/) and [Getting Started with DevTools Protocol](https://github.com/aslushnikov/getting-started-with-cdp/blob/HEAD/README.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `CDPSession` class.

</td></tr>
<tr><td>

<span id="connection">[Connection](./puppeteer.connection.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="consolemessage">[ConsoleMessage](./puppeteer.consolemessage.md)</span>

</td><td>

ConsoleMessage objects are dispatched by page via the 'console' event.

</td></tr>
<tr><td>

<span id="coverage">[Coverage](./puppeteer.coverage.md)</span>

</td><td>

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

**Remarks:**

To output coverage in a form consumable by [Istanbul](https://github.com/istanbuljs), see [puppeteer-to-istanbul](https://github.com/istanbuljs/puppeteer-to-istanbul).

</td></tr>
<tr><td>

<span id="csscoverage">[CSSCoverage](./puppeteer.csscoverage.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="devicerequestprompt">[DeviceRequestPrompt](./puppeteer.devicerequestprompt.md)</span>

</td><td>

Device request prompts let you respond to the page requesting for a device through an API like WebBluetooth.

**Remarks:**

`DeviceRequestPrompt` instances are returned via the [Page.waitForDevicePrompt()](./puppeteer.page.waitfordeviceprompt.md) method.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `DeviceRequestPrompt` class.

</td></tr>
<tr><td>

<span id="devicerequestpromptdevice">[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)</span>

</td><td>

Device in a request prompt.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `DeviceRequestPromptDevice` class.

</td></tr>
<tr><td>

<span id="dialog">[Dialog](./puppeteer.dialog.md)</span>

</td><td>

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Dialog` class.

</td></tr>
<tr><td>

<span id="elementhandle">[ElementHandle](./puppeteer.elementhandle.md)</span>

</td><td>

ElementHandle represents an in-page DOM element.

**Remarks:**

ElementHandles can be created with the [Page.$()](./puppeteer.page._.md) method.

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const hrefElement = await page.$('a');
  await hrefElement.click();
  // ...
})();
```

ElementHandle prevents the DOM element from being garbage-collected unless the handle is [disposed](./puppeteer.jshandle.dispose.md). ElementHandles are auto-disposed when their origin frame gets navigated.

ElementHandle instances can be used as arguments in [Page.$eval()](./puppeteer.page._eval.md) and [Page.evaluate()](./puppeteer.page.evaluate.md) methods.

If you're using TypeScript, ElementHandle takes a generic argument that denotes the type of element the handle is holding within. For example, if you have a handle to a `<select>` element, you can type it as `ElementHandle<HTMLSelectElement>` and you get some nicer type checks.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ElementHandle` class.

</td></tr>
<tr><td>

<span id="eventemitter">[EventEmitter](./puppeteer.eventemitter.md)</span>

</td><td>

The EventEmitter class that many Puppeteer classes extend.

**Remarks:**

This allows you to listen to events that Puppeteer classes fire and act accordingly. Therefore you'll mostly use [on](./puppeteer.eventemitter.on.md) and [off](./puppeteer.eventemitter.off.md) to bind and unbind to event listeners.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `EventEmitter` class.

</td></tr>
<tr><td>

<span id="filechooser">[FileChooser](./puppeteer.filechooser.md)</span>

</td><td>

File choosers let you react to the page requesting for a file.

**Remarks:**

`FileChooser` instances are returned via the [Page.waitForFileChooser()](./puppeteer.page.waitforfilechooser.md) method.

In browsers, only one file chooser can be opened at a time. All file choosers must be accepted or canceled. Not doing so will prevent subsequent file choosers from appearing.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `FileChooser` class.

</td></tr>
<tr><td>

<span id="frame">[Frame](./puppeteer.frame.md)</span>

</td><td>

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not effect frames inside the ambient frame the JavaScript executes in.

**Remarks:**

Frame lifecycles are controlled by three events that are all dispatched on the parent [page](./puppeteer.frame.page.md):

- [PageEvent.FrameAttached](./puppeteer.pageevent.md) - [PageEvent.FrameNavigated](./puppeteer.pageevent.md) - [PageEvent.FrameDetached](./puppeteer.pageevent.md)

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Frame` class.

</td></tr>
<tr><td>

<span id="httprequest">[HTTPRequest](./puppeteer.httprequest.md)</span>

</td><td>

Represents an HTTP request sent by a page.

**Remarks:**

Whenever the page sends a request, such as for a network resource, the following events are emitted by Puppeteer's `page`:

- `request`: emitted when the request is issued by the page. - `requestfinished` - emitted when the response body is downloaded and the request is complete.

If request fails at some point, then instead of `requestfinished` event the `requestfailed` event is emitted.

All of these events provide an instance of `HTTPRequest` representing the request that occurred:

```
page.on('request', request => ...)
```

NOTE: HTTP Error responses, such as 404 or 503, are still successful responses from HTTP standpoint, so request will complete with `requestfinished` event.

If request gets a 'redirect' response, the request is successfully finished with the `requestfinished` event, and a new request is issued to a redirected url.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `HTTPRequest` class.

</td></tr>
<tr><td>

<span id="httpresponse">[HTTPResponse](./puppeteer.httpresponse.md)</span>

</td><td>

The HTTPResponse class represents responses which are received by the [Page](./puppeteer.page.md) class.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `HTTPResponse` class.

</td></tr>
<tr><td>

<span id="jscoverage">[JSCoverage](./puppeteer.jscoverage.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="jshandle">[JSHandle](./puppeteer.jshandle.md)</span>

</td><td>

Represents a reference to a JavaScript object. Instances can be created using [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

Handles prevent the referenced JavaScript object from being garbage-collected unless the handle is purposely [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto-disposed when their associated frame is navigated away or the parent context gets destroyed.

Handles can be used as arguments for any evaluation function such as [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md). They are resolved to their referenced object.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `JSHandle` class.

</td></tr>
<tr><td>

<span id="keyboard">[Keyboard](./puppeteer.keyboard.md)</span>

</td><td>

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

**Remarks:**

For finer control, you can use [Keyboard.down()](./puppeteer.keyboard.down.md), [Keyboard.up()](./puppeteer.keyboard.up.md), and [Keyboard.sendCharacter()](./puppeteer.keyboard.sendcharacter.md) to manually fire events as if they were generated from a real keyboard.

On macOS, keyboard shortcuts like `⌘ A` -&gt; Select All do not work. See [\#1313](https://github.com/puppeteer/puppeteer/issues/1313).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Keyboard` class.

</td></tr>
<tr><td>

<span id="locator">[Locator](./puppeteer.locator.md)</span>

</td><td>

Locators describe a strategy of locating objects and performing an action on them. If the action fails because the object is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

</td></tr>
<tr><td>

<span id="mouse">[Mouse](./puppeteer.mouse.md)</span>

</td><td>

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

**Remarks:**

Every `page` object has its own Mouse, accessible with \[`page.mouse`\](\#pagemouse).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Mouse` class.

</td></tr>
<tr><td>

<span id="page">[Page](./puppeteer.page.md)</span>

</td><td>

Page provides methods to interact with a single tab or [extension background page](https://developer.chrome.com/extensions/background_pages) in the browser.

:::note

One Browser instance might have multiple Page instances.

:::

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Page` class.

</td></tr>
<tr><td>

<span id="productlauncher">[ProductLauncher](./puppeteer.productlauncher.md)</span>

</td><td>

Describes a launcher - a class that is able to create and launch a browser instance.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ProductLauncher` class.

</td></tr>
<tr><td>

<span id="protocolerror">[ProtocolError](./puppeteer.protocolerror.md)</span>

</td><td>

ProtocolError is emitted whenever there is an error from the protocol.

</td></tr>
<tr><td>

<span id="puppeteer">[Puppeteer](./puppeteer.puppeteer.md)</span>

</td><td>

The main Puppeteer class.

IMPORTANT: if you are using Puppeteer in a Node environment, you will get an instance of [PuppeteerNode](./puppeteer.puppeteernode.md) when you import or require `puppeteer`. That class extends `Puppeteer`, so has all the methods documented below as well as all that are defined on [PuppeteerNode](./puppeteer.puppeteernode.md).

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Puppeteer` class.

</td></tr>
<tr><td>

<span id="puppeteererror">[PuppeteerError](./puppeteer.puppeteererror.md)</span>

</td><td>

The base class for all Puppeteer-specific errors

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PuppeteerError` class.

</td></tr>
<tr><td>

<span id="puppeteernode">[PuppeteerNode](./puppeteer.puppeteernode.md)</span>

</td><td>

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

**Remarks:**

The most common method to use is [launch](./puppeteer.puppeteernode.launch.md), which is used to launch and connect to a new browser instance.

See [the main Puppeteer class](./puppeteer.puppeteer.md) for methods common to all environments, such as [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PuppeteerNode` class.

</td></tr>
<tr><td>

<span id="screenrecorder">[ScreenRecorder](./puppeteer.screenrecorder.md)</span>

</td><td>

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ScreenRecorder` class.

</td></tr>
<tr><td>

<span id="securitydetails">[SecurityDetails](./puppeteer.securitydetails.md)</span>

</td><td>

The SecurityDetails class represents the security details of a response that was received over a secure connection.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `SecurityDetails` class.

</td></tr>
<tr><td>

<span id="target">[Target](./puppeteer.target.md)</span>

</td><td>

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged such a frame, a page or a worker.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Target` class.

</td></tr>
<tr><td>

<span id="timeouterror">[TimeoutError](./puppeteer.timeouterror.md)</span>

</td><td>

TimeoutError is emitted whenever certain operations are terminated due to timeout.

**Remarks:**

Example operations are [page.waitForSelector](./puppeteer.page.waitforselector.md) or [puppeteer.launch](./puppeteer.puppeteernode.launch.md).

</td></tr>
<tr><td>

<span id="touchscreen">[Touchscreen](./puppeteer.touchscreen.md)</span>

</td><td>

The Touchscreen class exposes touchscreen events.

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Touchscreen` class.

</td></tr>
<tr><td>

<span id="tracing">[Tracing](./puppeteer.tracing.md)</span>

</td><td>

The Tracing class exposes the tracing audit interface.

**Remarks:**

You can use `tracing.start` and `tracing.stop` to create a trace file which can be opened in Chrome DevTools or [timeline viewer](https://chromedevtools.github.io/timeline-viewer/).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Tracing` class.

</td></tr>
<tr><td>

<span id="unsupportedoperation">[UnsupportedOperation](./puppeteer.unsupportedoperation.md)</span>

</td><td>

Puppeteer will throw this error if a method is not supported by the currently used protocol

</td></tr>
<tr><td>

<span id="webworker">[WebWorker](./puppeteer.webworker.md)</span>

</td><td>

This class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

**Remarks:**

The events `workercreated` and `workerdestroyed` are emitted on the page object to signal the worker lifecycle.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `WebWorker` class.

</td></tr>
</tbody></table>

## Enumerations

<table><thead><tr><th>

Enumeration

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="browsercontextevent">[BrowserContextEvent](./puppeteer.browsercontextevent.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="browserevent">[BrowserEvent](./puppeteer.browserevent.md)</span>

</td><td>

All the events a [browser instance](./puppeteer.browser.md) may emit.

</td></tr>
<tr><td>

<span id="interceptresolutionaction">[InterceptResolutionAction](./puppeteer.interceptresolutionaction.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="locatorevent">[LocatorEvent](./puppeteer.locatorevent.md)</span>

</td><td>

All the events that a locator instance may emit.

</td></tr>
<tr><td>

<span id="pageevent">[PageEvent](./puppeteer.pageevent.md)</span>

</td><td>

All the events that a page instance may emit.

</td></tr>
<tr><td>

<span id="targettype">[TargetType](./puppeteer.targettype.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Function

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="clearcustomqueryhandlers">[clearCustomQueryHandlers()](./puppeteer.clearcustomqueryhandlers.md)</span>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.clearCustomQueryHandlers()](./puppeteer.puppeteer.clearcustomqueryhandlers.md)

</td></tr>
<tr><td>

<span id="connect">[connect(options)](./puppeteer.connect.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="customqueryhandlernames">[customQueryHandlerNames()](./puppeteer.customqueryhandlernames.md)</span>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.customQueryHandlerNames()](./puppeteer.puppeteer.customqueryhandlernames.md)

</td></tr>
<tr><td>

<span id="defaultargs">[defaultArgs(options)](./puppeteer.defaultargs.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">[executablePath(channel)](./puppeteer.executablepath.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="launch">[launch(options)](./puppeteer.launch.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="registercustomqueryhandler">[registerCustomQueryHandler(name, handler)](./puppeteer.registercustomqueryhandler.md)</span>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.registerCustomQueryHandler()](./puppeteer.puppeteer.registercustomqueryhandler.md)

</td></tr>
<tr><td>

<span id="trimcache">[trimCache()](./puppeteer.trimcache.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="unregistercustomqueryhandler">[unregisterCustomQueryHandler(name)](./puppeteer.unregistercustomqueryhandler.md)</span>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.unregisterCustomQueryHandler()](./puppeteer.puppeteer.unregistercustomqueryhandler.md)

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Interface

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="actionoptions">[ActionOptions](./puppeteer.actionoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="autofilldata">[AutofillData](./puppeteer.autofilldata.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="boundingbox">[BoundingBox](./puppeteer.boundingbox.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="boxmodel">[BoxModel](./puppeteer.boxmodel.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="browserconnectoptions">[BrowserConnectOptions](./puppeteer.browserconnectoptions.md)</span>

</td><td>

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

</td></tr>
<tr><td>

<span id="browsercontextevents">[BrowserContextEvents](./puppeteer.browsercontextevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="browsercontextoptions">[BrowserContextOptions](./puppeteer.browsercontextoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="browserevents">[BrowserEvents](./puppeteer.browserevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="browserlaunchargumentoptions">[BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md)</span>

</td><td>

Launcher options that only apply to Chrome.

</td></tr>
<tr><td>

<span id="cdpsessionevents">[CDPSessionEvents](./puppeteer.cdpsessionevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="clickoptions">[ClickOptions](./puppeteer.clickoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="commandoptions">[CommandOptions](./puppeteer.commandoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="commoneventemitter">[CommonEventEmitter](./puppeteer.commoneventemitter.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="configuration">[Configuration](./puppeteer.configuration.md)</span>

</td><td>

Defines options to configure Puppeteer's behavior during installation and runtime.

See individual properties for more information.

</td></tr>
<tr><td>

<span id="connectiontransport">[ConnectionTransport](./puppeteer.connectiontransport.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="connectoptions">[ConnectOptions](./puppeteer.connectoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="consolemessagelocation">[ConsoleMessageLocation](./puppeteer.consolemessagelocation.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="continuerequestoverrides">[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="cookie">[Cookie](./puppeteer.cookie.md)</span>

</td><td>

Represents a cookie object.

</td></tr>
<tr><td>

<span id="cookieparam">[CookieParam](./puppeteer.cookieparam.md)</span>

</td><td>

Cookie parameter object

</td></tr>
<tr><td>

<span id="coverageentry">[CoverageEntry](./puppeteer.coverageentry.md)</span>

</td><td>

The CoverageEntry class represents one entry of the coverage report.

</td></tr>
<tr><td>

<span id="credentials">[Credentials](./puppeteer.credentials.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="csscoverageoptions">[CSSCoverageOptions](./puppeteer.csscoverageoptions.md)</span>

</td><td>

Set of configurable options for CSS coverage.

</td></tr>
<tr><td>

<span id="customqueryhandler">[CustomQueryHandler](./puppeteer.customqueryhandler.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="debuginfo">[DebugInfo](./puppeteer.debuginfo.md)</span>

</td><td>

**_(Experimental)_**

</td></tr>
<tr><td>

<span id="deletecookiesrequest">[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="device">[Device](./puppeteer.device.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="elementscreenshotoptions">[ElementScreenshotOptions](./puppeteer.elementscreenshotoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="frameaddscripttagoptions">[FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="frameaddstyletagoptions">[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="frameevents">[FrameEvents](./puppeteer.frameevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="framewaitforfunctionoptions">[FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="geolocationoptions">[GeolocationOptions](./puppeteer.geolocationoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="gotooptions">[GoToOptions](./puppeteer.gotooptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="interceptresolutionstate">[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="internalnetworkconditions">[InternalNetworkConditions](./puppeteer.internalnetworkconditions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="jscoverageentry">[JSCoverageEntry](./puppeteer.jscoverageentry.md)</span>

</td><td>

The CoverageEntry class for JavaScript

</td></tr>
<tr><td>

<span id="jscoverageoptions">[JSCoverageOptions](./puppeteer.jscoverageoptions.md)</span>

</td><td>

Set of configurable options for JS coverage.

</td></tr>
<tr><td>

<span id="keyboardtypeoptions">[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="keydownoptions">[KeyDownOptions](./puppeteer.keydownoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="launchoptions">[LaunchOptions](./puppeteer.launchoptions.md)</span>

</td><td>

Generic launch options that can be passed when launching any browser.

</td></tr>
<tr><td>

<span id="locatorevents">[LocatorEvents](./puppeteer.locatorevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="locatoroptions">[LocatorOptions](./puppeteer.locatoroptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="locatorscrolloptions">[LocatorScrollOptions](./puppeteer.locatorscrolloptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mediafeature">[MediaFeature](./puppeteer.mediafeature.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="metrics">[Metrics](./puppeteer.metrics.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mouseclickoptions">[MouseClickOptions](./puppeteer.mouseclickoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mousemoveoptions">[MouseMoveOptions](./puppeteer.mousemoveoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mouseoptions">[MouseOptions](./puppeteer.mouseoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mousewheeloptions">[MouseWheelOptions](./puppeteer.mousewheeloptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="moveable">[Moveable](./puppeteer.moveable.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="networkconditions">[NetworkConditions](./puppeteer.networkconditions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="newdocumentscriptevaluation">[NewDocumentScriptEvaluation](./puppeteer.newdocumentscriptevaluation.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="offset">[Offset](./puppeteer.offset.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="pageevents">[PageEvents](./puppeteer.pageevents.md)</span>

</td><td>

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

</td></tr>
<tr><td>

<span id="pdfmargin">[PDFMargin](./puppeteer.pdfmargin.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="pdfoptions">[PDFOptions](./puppeteer.pdfoptions.md)</span>

</td><td>

Valid options to configure PDF generation via [Page.pdf()](./puppeteer.page.pdf.md).

</td></tr>
<tr><td>

<span id="point">[Point](./puppeteer.point.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="puppeteerlaunchoptions">[PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="remoteaddress">[RemoteAddress](./puppeteer.remoteaddress.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="responseforrequest">[ResponseForRequest](./puppeteer.responseforrequest.md)</span>

</td><td>

Required response data to fulfill a request with.

</td></tr>
<tr><td>

<span id="screencastoptions">[ScreencastOptions](./puppeteer.screencastoptions.md)</span>

</td><td>

**_(Experimental)_**

</td></tr>
<tr><td>

<span id="screenshotclip">[ScreenshotClip](./puppeteer.screenshotclip.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="screenshotoptions">[ScreenshotOptions](./puppeteer.screenshotoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="serializedaxnode">[SerializedAXNode](./puppeteer.serializedaxnode.md)</span>

</td><td>

Represents a Node and the properties of it that are relevant to Accessibility.

</td></tr>
<tr><td>

<span id="snapshotoptions">[SnapshotOptions](./puppeteer.snapshotoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="tracingoptions">[TracingOptions](./puppeteer.tracingoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="viewport">[Viewport](./puppeteer.viewport.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="waitfornetworkidleoptions">[WaitForNetworkIdleOptions](./puppeteer.waitfornetworkidleoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="waitforoptions">[WaitForOptions](./puppeteer.waitforoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="waitforselectoroptions">[WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="waitfortargetoptions">[WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="waittimeoutoptions">[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Namespaces

<table><thead><tr><th>

Namespace

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="cdpsessionevent">[CDPSessionEvent](./puppeteer.cdpsessionevent.md)</span>

</td><td>

Events that the CDPSession class emits.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Variable

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="default_intercept_resolution_priority">[DEFAULT_INTERCEPT_RESOLUTION_PRIORITY](./puppeteer.default_intercept_resolution_priority.md)</span>

</td><td>

The default cooperative request interception resolution priority

</td></tr>
<tr><td>

<span id="knowndevices">[KnownDevices](./puppeteer.knowndevices.md)</span>

</td><td>

A list of devices to be used with [Page.emulate()](./puppeteer.page.emulate.md).

</td></tr>
<tr><td>

<span id="mousebutton">[MouseButton](./puppeteer.mousebutton.md)</span>

</td><td>

Enum of valid mouse buttons.

</td></tr>
<tr><td>

<span id="predefinednetworkconditions">[PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md)</span>

</td><td>

A list of network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

</td></tr>
<tr><td>

<span id="puppeteer">[puppeteer](./puppeteer.puppeteer.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Type Alias

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="actionresult">[ActionResult](./puppeteer.actionresult.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="awaitable">[Awaitable](./puppeteer.awaitable.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="awaitableiterable">[AwaitableIterable](./puppeteer.awaitableiterable.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="awaitablepredicate">[AwaitablePredicate](./puppeteer.awaitablepredicate.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="awaitedlocator">[AwaitedLocator](./puppeteer.awaitedlocator.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="cdpevents">[CDPEvents](./puppeteer.cdpevents.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="chromereleasechannel">[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="consolemessagetype">[ConsoleMessageType](./puppeteer.consolemessagetype.md)</span>

</td><td>

The supported types for console messages.

</td></tr>
<tr><td>

<span id="cookiepriority">[CookiePriority](./puppeteer.cookiepriority.md)</span>

</td><td>

Represents the cookie's 'Priority' status: https://tools.ietf.org/html/draft-west-cookie-priority-00

</td></tr>
<tr><td>

<span id="cookiesamesite">[CookieSameSite](./puppeteer.cookiesamesite.md)</span>

</td><td>

Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies

</td></tr>
<tr><td>

<span id="cookiesourcescheme">[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)</span>

</td><td>

Represents the source scheme of the origin that originally set the cookie. A value of "Unset" allows protocol clients to emulate legacy cookie scope for the scheme. This is a temporary ability and it will be removed in the future.

</td></tr>
<tr><td>

<span id="elementfor">[ElementFor](./puppeteer.elementfor.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="errorcode">[ErrorCode](./puppeteer.errorcode.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="evaluatefunc">[EvaluateFunc](./puppeteer.evaluatefunc.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="evaluatefuncwith">[EvaluateFuncWith](./puppeteer.evaluatefuncwith.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="eventswithwildcard">[EventsWithWildcard](./puppeteer.eventswithwildcard.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="eventtype">[EventType](./puppeteer.eventtype.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="experimentsconfiguration">[ExperimentsConfiguration](./puppeteer.experimentsconfiguration.md)</span>

</td><td>

Defines experiment options for Puppeteer.

See individual properties for more information.

</td></tr>
<tr><td>

<span id="flattenhandle">[FlattenHandle](./puppeteer.flattenhandle.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="handlefor">[HandleFor](./puppeteer.handlefor.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="handleor">[HandleOr](./puppeteer.handleor.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="handler">[Handler](./puppeteer.handler.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="innerparams">[InnerParams](./puppeteer.innerparams.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="keyinput">[KeyInput](./puppeteer.keyinput.md)</span>

</td><td>

All the valid keys that can be passed to functions that take user input, such as [keyboard.press](./puppeteer.keyboard.press.md)

</td></tr>
<tr><td>

<span id="keypressoptions">[KeyPressOptions](./puppeteer.keypressoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="locatorclickoptions">[LocatorClickOptions](./puppeteer.locatorclickoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="lowercasepaperformat">[LowerCasePaperFormat](./puppeteer.lowercasepaperformat.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mapper">[Mapper](./puppeteer.mapper.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="mousebutton">[MouseButton](./puppeteer.mousebutton.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="nodefor">[NodeFor](./puppeteer.nodefor.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="paperformat">[PaperFormat](./puppeteer.paperformat.md)</span>

</td><td>

All the valid paper format types when printing a PDF.

**Remarks:**

The sizes of each format are as follows:

- `Letter`: 8.5in x 11in

- `Legal`: 8.5in x 14in

- `Tabloid`: 11in x 17in

- `Ledger`: 17in x 11in

- `A0`: 33.1in x 46.8in

- `A1`: 23.4in x 33.1in

- `A2`: 16.54in x 23.4in

- `A3`: 11.7in x 16.54in

- `A4`: 8.27in x 11.7in

- `A5`: 5.83in x 8.27in

- `A6`: 4.13in x 5.83in

</td></tr>
<tr><td>

<span id="permission">[Permission](./puppeteer.permission.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="predicate">[Predicate](./puppeteer.predicate.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="product">[Product](./puppeteer.product.md)</span>

</td><td>

Supported products.

</td></tr>
<tr><td>

<span id="protocollifecycleevent">[ProtocolLifeCycleEvent](./puppeteer.protocollifecycleevent.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="protocoltype">[ProtocolType](./puppeteer.protocoltype.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="puppeteerlifecycleevent">[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="puppeteernodelaunchoptions">[PuppeteerNodeLaunchOptions](./puppeteer.puppeteernodelaunchoptions.md)</span>

</td><td>

Utility type exposed to enable users to define options that can be passed to `puppeteer.launch` without having to list the set of all types.

</td></tr>
<tr><td>

<span id="quad">[Quad](./puppeteer.quad.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="resourcetype">[ResourceType](./puppeteer.resourcetype.md)</span>

</td><td>

Resource types for HTTPRequests as perceived by the rendering engine.

</td></tr>
<tr><td>

<span id="targetfiltercallback">[TargetFilterCallback](./puppeteer.targetfiltercallback.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="visibilityoption">[VisibilityOption](./puppeteer.visibilityoption.md)</span>

</td><td>

</td></tr>
</tbody></table>
