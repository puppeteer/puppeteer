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

<p id="accessibility">[Accessibility](./puppeteer.accessibility.md)</p>

</td><td>

The Accessibility class provides methods for inspecting the browser's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

</td></tr>
<tr><td>

<p id="browser">[Browser](./puppeteer.browser.md)</p>

</td><td>

[Browser](./puppeteer.browser.md) represents a browser instance that is either:

- connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) or - launched by [PuppeteerNode.launch()](./puppeteer.puppeteernode.launch.md).

[Browser](./puppeteer.browser.md) [emits](./puppeteer.eventemitter.emit.md) various events which are documented in the [BrowserEvent](./puppeteer.browserevent.md) enum.

</td></tr>
<tr><td>

<p id="browsercontext">[BrowserContext](./puppeteer.browsercontext.md)</p>

</td><td>

[BrowserContext](./puppeteer.browsercontext.md) represents individual user contexts within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has a single [browser context](./puppeteer.browsercontext.md) by default. Others can be created using [Browser.createBrowserContext()](./puppeteer.browser.createbrowsercontext.md). Each context has isolated storage (cookies/localStorage/etc.)

[BrowserContext](./puppeteer.browsercontext.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserContextEvent](./puppeteer.browsercontextevent.md) enum.

If a [page](./puppeteer.page.md) opens another [page](./puppeteer.page.md), e.g. using `window.open`, the popup will belong to the parent [page's browser context](./puppeteer.page.browsercontext.md).

</td></tr>
<tr><td>

<p id="cdpsession">[CDPSession](./puppeteer.cdpsession.md)</p>

</td><td>

The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.

</td></tr>
<tr><td>

<p id="connection">[Connection](./puppeteer.connection.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="consolemessage">[ConsoleMessage](./puppeteer.consolemessage.md)</p>

</td><td>

ConsoleMessage objects are dispatched by page via the 'console' event.

</td></tr>
<tr><td>

<p id="coverage">[Coverage](./puppeteer.coverage.md)</p>

</td><td>

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

</td></tr>
<tr><td>

<p id="csscoverage">[CSSCoverage](./puppeteer.csscoverage.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="devicerequestprompt">[DeviceRequestPrompt](./puppeteer.devicerequestprompt.md)</p>

</td><td>

Device request prompts let you respond to the page requesting for a device through an API like WebBluetooth.

</td></tr>
<tr><td>

<p id="devicerequestpromptdevice">[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)</p>

</td><td>

Device in a request prompt.

</td></tr>
<tr><td>

<p id="dialog">[Dialog](./puppeteer.dialog.md)</p>

</td><td>

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

</td></tr>
<tr><td>

<p id="elementhandle">[ElementHandle](./puppeteer.elementhandle.md)</p>

</td><td>

ElementHandle represents an in-page DOM element.

</td></tr>
<tr><td>

<p id="eventemitter">[EventEmitter](./puppeteer.eventemitter.md)</p>

</td><td>

The EventEmitter class that many Puppeteer classes extend.

</td></tr>
<tr><td>

<p id="filechooser">[FileChooser](./puppeteer.filechooser.md)</p>

</td><td>

File choosers let you react to the page requesting for a file.

</td></tr>
<tr><td>

<p id="frame">[Frame](./puppeteer.frame.md)</p>

</td><td>

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not effect frames inside the ambient frame the JavaScript executes in.

</td></tr>
<tr><td>

<p id="httprequest">[HTTPRequest](./puppeteer.httprequest.md)</p>

</td><td>

Represents an HTTP request sent by a page.

</td></tr>
<tr><td>

<p id="httpresponse">[HTTPResponse](./puppeteer.httpresponse.md)</p>

</td><td>

The HTTPResponse class represents responses which are received by the [Page](./puppeteer.page.md) class.

</td></tr>
<tr><td>

<p id="jscoverage">[JSCoverage](./puppeteer.jscoverage.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="jshandle">[JSHandle](./puppeteer.jshandle.md)</p>

</td><td>

Represents a reference to a JavaScript object. Instances can be created using [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

Handles prevent the referenced JavaScript object from being garbage-collected unless the handle is purposely [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto-disposed when their associated frame is navigated away or the parent context gets destroyed.

Handles can be used as arguments for any evaluation function such as [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md). They are resolved to their referenced object.

</td></tr>
<tr><td>

<p id="keyboard">[Keyboard](./puppeteer.keyboard.md)</p>

</td><td>

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

</td></tr>
<tr><td>

<p id="locator">[Locator](./puppeteer.locator.md)</p>

</td><td>

Locators describe a strategy of locating objects and performing an action on them. If the action fails because the object is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

</td></tr>
<tr><td>

<p id="mouse">[Mouse](./puppeteer.mouse.md)</p>

</td><td>

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

</td></tr>
<tr><td>

<p id="page">[Page](./puppeteer.page.md)</p>

</td><td>

Page provides methods to interact with a single tab or [extension background page](https://developer.chrome.com/extensions/background_pages) in the browser.

:::note

One Browser instance might have multiple Page instances.

:::

</td></tr>
<tr><td>

<p id="productlauncher">[ProductLauncher](./puppeteer.productlauncher.md)</p>

</td><td>

Describes a launcher - a class that is able to create and launch a browser instance.

</td></tr>
<tr><td>

<p id="protocolerror">[ProtocolError](./puppeteer.protocolerror.md)</p>

</td><td>

ProtocolError is emitted whenever there is an error from the protocol.

</td></tr>
<tr><td>

<p id="puppeteer">[Puppeteer](./puppeteer.puppeteer.md)</p>

</td><td>

The main Puppeteer class.

IMPORTANT: if you are using Puppeteer in a Node environment, you will get an instance of [PuppeteerNode](./puppeteer.puppeteernode.md) when you import or require `puppeteer`. That class extends `Puppeteer`, so has all the methods documented below as well as all that are defined on [PuppeteerNode](./puppeteer.puppeteernode.md).

</td></tr>
<tr><td>

<p id="puppeteererror">[PuppeteerError](./puppeteer.puppeteererror.md)</p>

</td><td>

The base class for all Puppeteer-specific errors

</td></tr>
<tr><td>

<p id="puppeteernode">[PuppeteerNode](./puppeteer.puppeteernode.md)</p>

</td><td>

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

</td></tr>
<tr><td>

<p id="screenrecorder">[ScreenRecorder](./puppeteer.screenrecorder.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="securitydetails">[SecurityDetails](./puppeteer.securitydetails.md)</p>

</td><td>

The SecurityDetails class represents the security details of a response that was received over a secure connection.

</td></tr>
<tr><td>

<p id="target">[Target](./puppeteer.target.md)</p>

</td><td>

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged such a frame, a page or a worker.

</td></tr>
<tr><td>

<p id="timeouterror">[TimeoutError](./puppeteer.timeouterror.md)</p>

</td><td>

TimeoutError is emitted whenever certain operations are terminated due to timeout.

</td></tr>
<tr><td>

<p id="touchscreen">[Touchscreen](./puppeteer.touchscreen.md)</p>

</td><td>

The Touchscreen class exposes touchscreen events.

</td></tr>
<tr><td>

<p id="tracing">[Tracing](./puppeteer.tracing.md)</p>

</td><td>

The Tracing class exposes the tracing audit interface.

</td></tr>
<tr><td>

<p id="unsupportedoperation">[UnsupportedOperation](./puppeteer.unsupportedoperation.md)</p>

</td><td>

Puppeteer will throw this error if a method is not supported by the currently used protocol

</td></tr>
<tr><td>

<p id="webworker">[WebWorker](./puppeteer.webworker.md)</p>

</td><td>

This class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

</td></tr>
</tbody></table>

## Enumerations

<table><thead><tr><th>

Enumeration

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<p id="browsercontextevent">[BrowserContextEvent](./puppeteer.browsercontextevent.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="browserevent">[BrowserEvent](./puppeteer.browserevent.md)</p>

</td><td>

All the events a [browser instance](./puppeteer.browser.md) may emit.

</td></tr>
<tr><td>

<p id="interceptresolutionaction">[InterceptResolutionAction](./puppeteer.interceptresolutionaction.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="locatorevent">[LocatorEvent](./puppeteer.locatorevent.md)</p>

</td><td>

All the events that a locator instance may emit.

</td></tr>
<tr><td>

<p id="pageevent">[PageEvent](./puppeteer.pageevent.md)</p>

</td><td>

All the events that a page instance may emit.

</td></tr>
<tr><td>

<p id="targettype">[TargetType](./puppeteer.targettype.md)</p>

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

<p id="clearcustomqueryhandlers">[clearCustomQueryHandlers()](./puppeteer.clearcustomqueryhandlers.md)</p>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.clearCustomQueryHandlers()](./puppeteer.puppeteer.clearcustomqueryhandlers.md)

</td></tr>
<tr><td>

<p id="connect">[connect(options)](./puppeteer.connect.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="customqueryhandlernames">[customQueryHandlerNames()](./puppeteer.customqueryhandlernames.md)</p>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.customQueryHandlerNames()](./puppeteer.puppeteer.customqueryhandlernames.md)

</td></tr>
<tr><td>

<p id="defaultargs">[defaultArgs(options)](./puppeteer.defaultargs.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="executablepath">[executablePath(channel)](./puppeteer.executablepath.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="launch">[launch(options)](./puppeteer.launch.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="registercustomqueryhandler">[registerCustomQueryHandler(name, handler)](./puppeteer.registercustomqueryhandler.md)</p>

</td><td>

**Deprecated:**

Import [Puppeteer](./puppeteer.puppeteer.md) and use the static method [Puppeteer.registerCustomQueryHandler()](./puppeteer.puppeteer.registercustomqueryhandler.md)

</td></tr>
<tr><td>

<p id="trimcache">[trimCache()](./puppeteer.trimcache.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="unregistercustomqueryhandler">[unregisterCustomQueryHandler(name)](./puppeteer.unregistercustomqueryhandler.md)</p>

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

<p id="actionoptions">[ActionOptions](./puppeteer.actionoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="autofilldata">[AutofillData](./puppeteer.autofilldata.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="boundingbox">[BoundingBox](./puppeteer.boundingbox.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="boxmodel">[BoxModel](./puppeteer.boxmodel.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="browserconnectoptions">[BrowserConnectOptions](./puppeteer.browserconnectoptions.md)</p>

</td><td>

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

</td></tr>
<tr><td>

<p id="browsercontextevents">[BrowserContextEvents](./puppeteer.browsercontextevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="browsercontextoptions">[BrowserContextOptions](./puppeteer.browsercontextoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="browserevents">[BrowserEvents](./puppeteer.browserevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="browserlaunchargumentoptions">[BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md)</p>

</td><td>

Launcher options that only apply to Chrome.

</td></tr>
<tr><td>

<p id="cdpsessionevents">[CDPSessionEvents](./puppeteer.cdpsessionevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="clickoptions">[ClickOptions](./puppeteer.clickoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="commandoptions">[CommandOptions](./puppeteer.commandoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="commoneventemitter">[CommonEventEmitter](./puppeteer.commoneventemitter.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="configuration">[Configuration](./puppeteer.configuration.md)</p>

</td><td>

Defines options to configure Puppeteer's behavior during installation and runtime.

See individual properties for more information.

</td></tr>
<tr><td>

<p id="connectiontransport">[ConnectionTransport](./puppeteer.connectiontransport.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="connectoptions">[ConnectOptions](./puppeteer.connectoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="consolemessagelocation">[ConsoleMessageLocation](./puppeteer.consolemessagelocation.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="continuerequestoverrides">[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="cookie">[Cookie](./puppeteer.cookie.md)</p>

</td><td>

Represents a cookie object.

</td></tr>
<tr><td>

<p id="cookieparam">[CookieParam](./puppeteer.cookieparam.md)</p>

</td><td>

Cookie parameter object

</td></tr>
<tr><td>

<p id="coverageentry">[CoverageEntry](./puppeteer.coverageentry.md)</p>

</td><td>

The CoverageEntry class represents one entry of the coverage report.

</td></tr>
<tr><td>

<p id="credentials">[Credentials](./puppeteer.credentials.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="csscoverageoptions">[CSSCoverageOptions](./puppeteer.csscoverageoptions.md)</p>

</td><td>

Set of configurable options for CSS coverage.

</td></tr>
<tr><td>

<p id="customqueryhandler">[CustomQueryHandler](./puppeteer.customqueryhandler.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="debuginfo">[DebugInfo](./puppeteer.debuginfo.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="deletecookiesrequest">[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="device">[Device](./puppeteer.device.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="elementscreenshotoptions">[ElementScreenshotOptions](./puppeteer.elementscreenshotoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="frameaddscripttagoptions">[FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="frameaddstyletagoptions">[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="frameevents">[FrameEvents](./puppeteer.frameevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="framewaitforfunctionoptions">[FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="geolocationoptions">[GeolocationOptions](./puppeteer.geolocationoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="gotooptions">[GoToOptions](./puppeteer.gotooptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="interceptresolutionstate">[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="internalnetworkconditions">[InternalNetworkConditions](./puppeteer.internalnetworkconditions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="jscoverageentry">[JSCoverageEntry](./puppeteer.jscoverageentry.md)</p>

</td><td>

The CoverageEntry class for JavaScript

</td></tr>
<tr><td>

<p id="jscoverageoptions">[JSCoverageOptions](./puppeteer.jscoverageoptions.md)</p>

</td><td>

Set of configurable options for JS coverage.

</td></tr>
<tr><td>

<p id="keyboardtypeoptions">[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="keydownoptions">[KeyDownOptions](./puppeteer.keydownoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="launchoptions">[LaunchOptions](./puppeteer.launchoptions.md)</p>

</td><td>

Generic launch options that can be passed when launching any browser.

</td></tr>
<tr><td>

<p id="locatorevents">[LocatorEvents](./puppeteer.locatorevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="locatoroptions">[LocatorOptions](./puppeteer.locatoroptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="locatorscrolloptions">[LocatorScrollOptions](./puppeteer.locatorscrolloptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mediafeature">[MediaFeature](./puppeteer.mediafeature.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="metrics">[Metrics](./puppeteer.metrics.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mouseclickoptions">[MouseClickOptions](./puppeteer.mouseclickoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mousemoveoptions">[MouseMoveOptions](./puppeteer.mousemoveoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mouseoptions">[MouseOptions](./puppeteer.mouseoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mousewheeloptions">[MouseWheelOptions](./puppeteer.mousewheeloptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="moveable">[Moveable](./puppeteer.moveable.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="networkconditions">[NetworkConditions](./puppeteer.networkconditions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="newdocumentscriptevaluation">[NewDocumentScriptEvaluation](./puppeteer.newdocumentscriptevaluation.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="offset">[Offset](./puppeteer.offset.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="pageevents">[PageEvents](./puppeteer.pageevents.md)</p>

</td><td>

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

</td></tr>
<tr><td>

<p id="pdfmargin">[PDFMargin](./puppeteer.pdfmargin.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="pdfoptions">[PDFOptions](./puppeteer.pdfoptions.md)</p>

</td><td>

Valid options to configure PDF generation via [Page.pdf()](./puppeteer.page.pdf.md).

</td></tr>
<tr><td>

<p id="point">[Point](./puppeteer.point.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="puppeteerlaunchoptions">[PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="remoteaddress">[RemoteAddress](./puppeteer.remoteaddress.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="responseforrequest">[ResponseForRequest](./puppeteer.responseforrequest.md)</p>

</td><td>

Required response data to fulfill a request with.

</td></tr>
<tr><td>

<p id="screencastoptions">[ScreencastOptions](./puppeteer.screencastoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="screenshotclip">[ScreenshotClip](./puppeteer.screenshotclip.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="screenshotoptions">[ScreenshotOptions](./puppeteer.screenshotoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="serializedaxnode">[SerializedAXNode](./puppeteer.serializedaxnode.md)</p>

</td><td>

Represents a Node and the properties of it that are relevant to Accessibility.

</td></tr>
<tr><td>

<p id="snapshotoptions">[SnapshotOptions](./puppeteer.snapshotoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="tracingoptions">[TracingOptions](./puppeteer.tracingoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="viewport">[Viewport](./puppeteer.viewport.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="waitfornetworkidleoptions">[WaitForNetworkIdleOptions](./puppeteer.waitfornetworkidleoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="waitforoptions">[WaitForOptions](./puppeteer.waitforoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="waitforselectoroptions">[WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="waitfortargetoptions">[WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="waittimeoutoptions">[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)</p>

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

<p id="cdpsessionevent">[CDPSessionEvent](./puppeteer.cdpsessionevent.md)</p>

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

<p id="default_intercept_resolution_priority">[DEFAULT\_INTERCEPT\_RESOLUTION\_PRIORITY](./puppeteer.default_intercept_resolution_priority.md)</p>

</td><td>

The default cooperative request interception resolution priority

</td></tr>
<tr><td>

<p id="knowndevices">[KnownDevices](./puppeteer.knowndevices.md)</p>

</td><td>

A list of devices to be used with [Page.emulate()](./puppeteer.page.emulate.md).

</td></tr>
<tr><td>

<p id="mousebutton">[MouseButton](./puppeteer.mousebutton.md)</p>

</td><td>

Enum of valid mouse buttons.

</td></tr>
<tr><td>

<p id="predefinednetworkconditions">[PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md)</p>

</td><td>

A list of network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

</td></tr>
<tr><td>

<p id="puppeteer">[puppeteer](./puppeteer.puppeteer.md)</p>

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

<p id="actionresult">[ActionResult](./puppeteer.actionresult.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="awaitable">[Awaitable](./puppeteer.awaitable.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="awaitableiterable">[AwaitableIterable](./puppeteer.awaitableiterable.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="awaitablepredicate">[AwaitablePredicate](./puppeteer.awaitablepredicate.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="awaitedlocator">[AwaitedLocator](./puppeteer.awaitedlocator.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="cdpevents">[CDPEvents](./puppeteer.cdpevents.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="chromereleasechannel">[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="consolemessagetype">[ConsoleMessageType](./puppeteer.consolemessagetype.md)</p>

</td><td>

The supported types for console messages.

</td></tr>
<tr><td>

<p id="cookiepriority">[CookiePriority](./puppeteer.cookiepriority.md)</p>

</td><td>

Represents the cookie's 'Priority' status: https://tools.ietf.org/html/draft-west-cookie-priority-00

</td></tr>
<tr><td>

<p id="cookiesamesite">[CookieSameSite](./puppeteer.cookiesamesite.md)</p>

</td><td>

Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies

</td></tr>
<tr><td>

<p id="cookiesourcescheme">[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)</p>

</td><td>

Represents the source scheme of the origin that originally set the cookie. A value of "Unset" allows protocol clients to emulate legacy cookie scope for the scheme. This is a temporary ability and it will be removed in the future.

</td></tr>
<tr><td>

<p id="elementfor">[ElementFor](./puppeteer.elementfor.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="errorcode">[ErrorCode](./puppeteer.errorcode.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="evaluatefunc">[EvaluateFunc](./puppeteer.evaluatefunc.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="evaluatefuncwith">[EvaluateFuncWith](./puppeteer.evaluatefuncwith.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="eventswithwildcard">[EventsWithWildcard](./puppeteer.eventswithwildcard.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="eventtype">[EventType](./puppeteer.eventtype.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="experimentsconfiguration">[ExperimentsConfiguration](./puppeteer.experimentsconfiguration.md)</p>

</td><td>

Defines experiment options for Puppeteer.

See individual properties for more information.

</td></tr>
<tr><td>

<p id="flattenhandle">[FlattenHandle](./puppeteer.flattenhandle.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="handlefor">[HandleFor](./puppeteer.handlefor.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="handleor">[HandleOr](./puppeteer.handleor.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="handler">[Handler](./puppeteer.handler.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="innerparams">[InnerParams](./puppeteer.innerparams.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="keyinput">[KeyInput](./puppeteer.keyinput.md)</p>

</td><td>

All the valid keys that can be passed to functions that take user input, such as [keyboard.press](./puppeteer.keyboard.press.md)

</td></tr>
<tr><td>

<p id="keypressoptions">[KeyPressOptions](./puppeteer.keypressoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="locatorclickoptions">[LocatorClickOptions](./puppeteer.locatorclickoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="lowercasepaperformat">[LowerCasePaperFormat](./puppeteer.lowercasepaperformat.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mapper">[Mapper](./puppeteer.mapper.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="mousebutton">[MouseButton](./puppeteer.mousebutton.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="nodefor">[NodeFor](./puppeteer.nodefor.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="paperformat">[PaperFormat](./puppeteer.paperformat.md)</p>

</td><td>

All the valid paper format types when printing a PDF.

</td></tr>
<tr><td>

<p id="permission">[Permission](./puppeteer.permission.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="predicate">[Predicate](./puppeteer.predicate.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="product">[Product](./puppeteer.product.md)</p>

</td><td>

Supported products.

</td></tr>
<tr><td>

<p id="protocollifecycleevent">[ProtocolLifeCycleEvent](./puppeteer.protocollifecycleevent.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="protocoltype">[ProtocolType](./puppeteer.protocoltype.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="puppeteerlifecycleevent">[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="puppeteernodelaunchoptions">[PuppeteerNodeLaunchOptions](./puppeteer.puppeteernodelaunchoptions.md)</p>

</td><td>

Utility type exposed to enable users to define options that can be passed to `puppeteer.launch` without having to list the set of all types.

</td></tr>
<tr><td>

<p id="quad">[Quad](./puppeteer.quad.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="resourcetype">[ResourceType](./puppeteer.resourcetype.md)</p>

</td><td>

Resource types for HTTPRequests as perceived by the rendering engine.

</td></tr>
<tr><td>

<p id="targetfiltercallback">[TargetFilterCallback](./puppeteer.targetfiltercallback.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="visibilityoption">[VisibilityOption](./puppeteer.visibilityoption.md)</p>

</td><td>

</td></tr>
</tbody></table>
