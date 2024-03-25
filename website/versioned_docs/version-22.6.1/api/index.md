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

[Accessibility](./puppeteer.accessibility.md)

</td><td>

The Accessibility class provides methods for inspecting the browser's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

</td></tr>
<tr><td>

[Browser](./puppeteer.browser.md)

</td><td>

[Browser](./puppeteer.browser.md) represents a browser instance that is either:

- connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) or - launched by [PuppeteerNode.launch()](./puppeteer.puppeteernode.launch.md).

[Browser](./puppeteer.browser.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserEvent](./puppeteer.browserevent.md) enum.

</td></tr>
<tr><td>

[BrowserContext](./puppeteer.browsercontext.md)

</td><td>

[BrowserContext](./puppeteer.browsercontext.md) represents individual user contexts within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has a single [browser context](./puppeteer.browsercontext.md) by default. Others can be created using [Browser.createBrowserContext()](./puppeteer.browser.createbrowsercontext.md). Each context has isolated storage (cookies/localStorage/etc.)

[BrowserContext](./puppeteer.browsercontext.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserContextEvent](./puppeteer.browsercontextevent.md) enum.

If a [page](./puppeteer.page.md) opens another [page](./puppeteer.page.md), e.g. using `window.open`, the popup will belong to the parent [page's browser context](./puppeteer.page.browsercontext.md).

</td></tr>
<tr><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.

</td></tr>
<tr><td>

[Connection](./puppeteer.connection.md)

</td><td>

</td></tr>
<tr><td>

[ConsoleMessage](./puppeteer.consolemessage.md)

</td><td>

ConsoleMessage objects are dispatched by page via the 'console' event.

</td></tr>
<tr><td>

[Coverage](./puppeteer.coverage.md)

</td><td>

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

</td></tr>
<tr><td>

[CSSCoverage](./puppeteer.csscoverage.md)

</td><td>

</td></tr>
<tr><td>

[DeviceRequestPrompt](./puppeteer.devicerequestprompt.md)

</td><td>

Device request prompts let you respond to the page requesting for a device through an API like WebBluetooth.

</td></tr>
<tr><td>

[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)

</td><td>

Device in a request prompt.

</td></tr>
<tr><td>

[Dialog](./puppeteer.dialog.md)

</td><td>

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

</td></tr>
<tr><td>

[ElementHandle](./puppeteer.elementhandle.md)

</td><td>

ElementHandle represents an in-page DOM element.

</td></tr>
<tr><td>

[EventEmitter](./puppeteer.eventemitter.md)

</td><td>

The EventEmitter class that many Puppeteer classes extend.

</td></tr>
<tr><td>

[FileChooser](./puppeteer.filechooser.md)

</td><td>

File choosers let you react to the page requesting for a file.

</td></tr>
<tr><td>

[Frame](./puppeteer.frame.md)

</td><td>

Represents a DOM frame.

To understand frames, you can think of frames as `<iframe>` elements. Just like iframes, frames can be nested, and when JavaScript is executed in a frame, the JavaScript does not effect frames inside the ambient frame the JavaScript executes in.

</td></tr>
<tr><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

Represents an HTTP request sent by a page.

</td></tr>
<tr><td>

[HTTPResponse](./puppeteer.httpresponse.md)

</td><td>

The HTTPResponse class represents responses which are received by the [Page](./puppeteer.page.md) class.

</td></tr>
<tr><td>

[JSCoverage](./puppeteer.jscoverage.md)

</td><td>

</td></tr>
<tr><td>

[JSHandle](./puppeteer.jshandle.md)

</td><td>

Represents a reference to a JavaScript object. Instances can be created using [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

Handles prevent the referenced JavaScript object from being garbage-collected unless the handle is purposely [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto-disposed when their associated frame is navigated away or the parent context gets destroyed.

Handles can be used as arguments for any evaluation function such as [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md). They are resolved to their referenced object.

</td></tr>
<tr><td>

[Keyboard](./puppeteer.keyboard.md)

</td><td>

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

</td></tr>
<tr><td>

[Locator](./puppeteer.locator.md)

</td><td>

Locators describe a strategy of locating objects and performing an action on them. If the action fails because the object is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

</td></tr>
<tr><td>

[Mouse](./puppeteer.mouse.md)

</td><td>

The Mouse class operates in main-frame CSS pixels relative to the top-left corner of the viewport.

</td></tr>
<tr><td>

[Page](./puppeteer.page.md)

</td><td>

Page provides methods to interact with a single tab or [extension background page](https://developer.chrome.com/extensions/background_pages) in the browser.

:::note

One Browser instance might have multiple Page instances.

:::

</td></tr>
<tr><td>

[ProductLauncher](./puppeteer.productlauncher.md)

</td><td>

Describes a launcher - a class that is able to create and launch a browser instance.

</td></tr>
<tr><td>

[ProtocolError](./puppeteer.protocolerror.md)

</td><td>

ProtocolError is emitted whenever there is an error from the protocol.

</td></tr>
<tr><td>

[Puppeteer](./puppeteer.puppeteer.md)

</td><td>

The main Puppeteer class.

IMPORTANT: if you are using Puppeteer in a Node environment, you will get an instance of [PuppeteerNode](./puppeteer.puppeteernode.md) when you import or require `puppeteer`. That class extends `Puppeteer`, so has all the methods documented below as well as all that are defined on [PuppeteerNode](./puppeteer.puppeteernode.md).

</td></tr>
<tr><td>

[PuppeteerError](./puppeteer.puppeteererror.md)

</td><td>

The base class for all Puppeteer-specific errors

</td></tr>
<tr><td>

[PuppeteerNode](./puppeteer.puppeteernode.md)

</td><td>

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

</td></tr>
<tr><td>

[ScreenRecorder](./puppeteer.screenrecorder.md)

</td><td>

</td></tr>
<tr><td>

[SecurityDetails](./puppeteer.securitydetails.md)

</td><td>

The SecurityDetails class represents the security details of a response that was received over a secure connection.

</td></tr>
<tr><td>

[Target](./puppeteer.target.md)

</td><td>

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged such a frame, a page or a worker.

</td></tr>
<tr><td>

[TimeoutError](./puppeteer.timeouterror.md)

</td><td>

TimeoutError is emitted whenever certain operations are terminated due to timeout.

</td></tr>
<tr><td>

[Touchscreen](./puppeteer.touchscreen.md)

</td><td>

The Touchscreen class exposes touchscreen events.

</td></tr>
<tr><td>

[Tracing](./puppeteer.tracing.md)

</td><td>

The Tracing class exposes the tracing audit interface.

</td></tr>
<tr><td>

[UnsupportedOperation](./puppeteer.unsupportedoperation.md)

</td><td>

Puppeteer will throw this error if a method is not supported by the currently used protocol

</td></tr>
<tr><td>

[WebWorker](./puppeteer.webworker.md)

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

[BrowserContextEvent](./puppeteer.browsercontextevent.md)

</td><td>

</td></tr>
<tr><td>

[BrowserEvent](./puppeteer.browserevent.md)

</td><td>

All the events a [browser instance](./puppeteer.browser.md) may emit.

</td></tr>
<tr><td>

[InterceptResolutionAction](./puppeteer.interceptresolutionaction.md)

</td><td>

</td></tr>
<tr><td>

[LocatorEvent](./puppeteer.locatorevent.md)

</td><td>

All the events that a locator instance may emit.

</td></tr>
<tr><td>

[PageEvent](./puppeteer.pageevent.md)

</td><td>

All the events that a page instance may emit.

</td></tr>
<tr><td>

[TargetType](./puppeteer.targettype.md)

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

[clearCustomQueryHandlers()](./puppeteer.clearcustomqueryhandlers.md)

</td><td>

</td></tr>
<tr><td>

[connect(options)](./puppeteer.connect.md)

</td><td>

</td></tr>
<tr><td>

[customQueryHandlerNames()](./puppeteer.customqueryhandlernames.md)

</td><td>

</td></tr>
<tr><td>

[defaultArgs(options)](./puppeteer.defaultargs.md)

</td><td>

</td></tr>
<tr><td>

[executablePath(channel)](./puppeteer.executablepath.md)

</td><td>

</td></tr>
<tr><td>

[launch(options)](./puppeteer.launch.md)

</td><td>

</td></tr>
<tr><td>

[registerCustomQueryHandler(name, handler)](./puppeteer.registercustomqueryhandler.md)

</td><td>

</td></tr>
<tr><td>

[trimCache()](./puppeteer.trimcache.md)

</td><td>

</td></tr>
<tr><td>

[unregisterCustomQueryHandler(name)](./puppeteer.unregistercustomqueryhandler.md)

</td><td>

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Interface

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[ActionOptions](./puppeteer.actionoptions.md)

</td><td>

</td></tr>
<tr><td>

[AutofillData](./puppeteer.autofilldata.md)

</td><td>

</td></tr>
<tr><td>

[BoundingBox](./puppeteer.boundingbox.md)

</td><td>

</td></tr>
<tr><td>

[BoxModel](./puppeteer.boxmodel.md)

</td><td>

</td></tr>
<tr><td>

[BrowserConnectOptions](./puppeteer.browserconnectoptions.md)

</td><td>

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

</td></tr>
<tr><td>

[BrowserContextEvents](./puppeteer.browsercontextevents.md)

</td><td>

</td></tr>
<tr><td>

[BrowserContextOptions](./puppeteer.browsercontextoptions.md)

</td><td>

</td></tr>
<tr><td>

[BrowserEvents](./puppeteer.browserevents.md)

</td><td>

</td></tr>
<tr><td>

[BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md)

</td><td>

Launcher options that only apply to Chrome.

</td></tr>
<tr><td>

[CDPSessionEvents](./puppeteer.cdpsessionevents.md)

</td><td>

</td></tr>
<tr><td>

[ClickOptions](./puppeteer.clickoptions.md)

</td><td>

</td></tr>
<tr><td>

[CommandOptions](./puppeteer.commandoptions.md)

</td><td>

</td></tr>
<tr><td>

[CommonEventEmitter](./puppeteer.commoneventemitter.md)

</td><td>

</td></tr>
<tr><td>

[Configuration](./puppeteer.configuration.md)

</td><td>

Defines options to configure Puppeteer's behavior during installation and runtime.

See individual properties for more information.

</td></tr>
<tr><td>

[ConnectionTransport](./puppeteer.connectiontransport.md)

</td><td>

</td></tr>
<tr><td>

[ConnectOptions](./puppeteer.connectoptions.md)

</td><td>

</td></tr>
<tr><td>

[ConsoleMessageLocation](./puppeteer.consolemessagelocation.md)

</td><td>

</td></tr>
<tr><td>

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)

</td><td>

</td></tr>
<tr><td>

[Cookie](./puppeteer.cookie.md)

</td><td>

Represents a cookie object.

</td></tr>
<tr><td>

[CookieParam](./puppeteer.cookieparam.md)

</td><td>

Cookie parameter object

</td></tr>
<tr><td>

[CoverageEntry](./puppeteer.coverageentry.md)

</td><td>

The CoverageEntry class represents one entry of the coverage report.

</td></tr>
<tr><td>

[Credentials](./puppeteer.credentials.md)

</td><td>

</td></tr>
<tr><td>

[CSSCoverageOptions](./puppeteer.csscoverageoptions.md)

</td><td>

Set of configurable options for CSS coverage.

</td></tr>
<tr><td>

[CustomQueryHandler](./puppeteer.customqueryhandler.md)

</td><td>

</td></tr>
<tr><td>

[DebugInfo](./puppeteer.debuginfo.md)

</td><td>

</td></tr>
<tr><td>

[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)

</td><td>

</td></tr>
<tr><td>

[Device](./puppeteer.device.md)

</td><td>

</td></tr>
<tr><td>

[ElementScreenshotOptions](./puppeteer.elementscreenshotoptions.md)

</td><td>

</td></tr>
<tr><td>

[FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md)

</td><td>

</td></tr>
<tr><td>

[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md)

</td><td>

</td></tr>
<tr><td>

[FrameEvents](./puppeteer.frameevents.md)

</td><td>

</td></tr>
<tr><td>

[FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md)

</td><td>

</td></tr>
<tr><td>

[GeolocationOptions](./puppeteer.geolocationoptions.md)

</td><td>

</td></tr>
<tr><td>

[GoToOptions](./puppeteer.gotooptions.md)

</td><td>

</td></tr>
<tr><td>

[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)

</td><td>

</td></tr>
<tr><td>

[InternalNetworkConditions](./puppeteer.internalnetworkconditions.md)

</td><td>

</td></tr>
<tr><td>

[JSCoverageEntry](./puppeteer.jscoverageentry.md)

</td><td>

The CoverageEntry class for JavaScript

</td></tr>
<tr><td>

[JSCoverageOptions](./puppeteer.jscoverageoptions.md)

</td><td>

Set of configurable options for JS coverage.

</td></tr>
<tr><td>

[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)

</td><td>

</td></tr>
<tr><td>

[KeyDownOptions](./puppeteer.keydownoptions.md)

</td><td>

</td></tr>
<tr><td>

[LaunchOptions](./puppeteer.launchoptions.md)

</td><td>

Generic launch options that can be passed when launching any browser.

</td></tr>
<tr><td>

[LocatorEvents](./puppeteer.locatorevents.md)

</td><td>

</td></tr>
<tr><td>

[LocatorOptions](./puppeteer.locatoroptions.md)

</td><td>

</td></tr>
<tr><td>

[LocatorScrollOptions](./puppeteer.locatorscrolloptions.md)

</td><td>

</td></tr>
<tr><td>

[MediaFeature](./puppeteer.mediafeature.md)

</td><td>

</td></tr>
<tr><td>

[Metrics](./puppeteer.metrics.md)

</td><td>

</td></tr>
<tr><td>

[MouseClickOptions](./puppeteer.mouseclickoptions.md)

</td><td>

</td></tr>
<tr><td>

[MouseMoveOptions](./puppeteer.mousemoveoptions.md)

</td><td>

</td></tr>
<tr><td>

[MouseOptions](./puppeteer.mouseoptions.md)

</td><td>

</td></tr>
<tr><td>

[MouseWheelOptions](./puppeteer.mousewheeloptions.md)

</td><td>

</td></tr>
<tr><td>

[Moveable](./puppeteer.moveable.md)

</td><td>

</td></tr>
<tr><td>

[NetworkConditions](./puppeteer.networkconditions.md)

</td><td>

</td></tr>
<tr><td>

[NewDocumentScriptEvaluation](./puppeteer.newdocumentscriptevaluation.md)

</td><td>

</td></tr>
<tr><td>

[Offset](./puppeteer.offset.md)

</td><td>

</td></tr>
<tr><td>

[PageEvents](./puppeteer.pageevents.md)

</td><td>

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

</td></tr>
<tr><td>

[PDFMargin](./puppeteer.pdfmargin.md)

</td><td>

</td></tr>
<tr><td>

[PDFOptions](./puppeteer.pdfoptions.md)

</td><td>

Valid options to configure PDF generation via [Page.pdf()](./puppeteer.page.pdf.md).

</td></tr>
<tr><td>

[Point](./puppeteer.point.md)

</td><td>

</td></tr>
<tr><td>

[PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md)

</td><td>

</td></tr>
<tr><td>

[RemoteAddress](./puppeteer.remoteaddress.md)

</td><td>

</td></tr>
<tr><td>

[ResponseForRequest](./puppeteer.responseforrequest.md)

</td><td>

Required response data to fulfill a request with.

</td></tr>
<tr><td>

[ScreencastOptions](./puppeteer.screencastoptions.md)

</td><td>

</td></tr>
<tr><td>

[ScreenshotClip](./puppeteer.screenshotclip.md)

</td><td>

</td></tr>
<tr><td>

[ScreenshotOptions](./puppeteer.screenshotoptions.md)

</td><td>

</td></tr>
<tr><td>

[SerializedAXNode](./puppeteer.serializedaxnode.md)

</td><td>

Represents a Node and the properties of it that are relevant to Accessibility.

</td></tr>
<tr><td>

[SnapshotOptions](./puppeteer.snapshotoptions.md)

</td><td>

</td></tr>
<tr><td>

[TracingOptions](./puppeteer.tracingoptions.md)

</td><td>

</td></tr>
<tr><td>

[Viewport](./puppeteer.viewport.md)

</td><td>

</td></tr>
<tr><td>

[WaitForNetworkIdleOptions](./puppeteer.waitfornetworkidleoptions.md)

</td><td>

</td></tr>
<tr><td>

[WaitForOptions](./puppeteer.waitforoptions.md)

</td><td>

</td></tr>
<tr><td>

[WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md)

</td><td>

</td></tr>
<tr><td>

[WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)

</td><td>

</td></tr>
<tr><td>

[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

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

[CDPSessionEvent](./puppeteer.cdpsessionevent.md)

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

[DEFAULT_INTERCEPT_RESOLUTION_PRIORITY](./puppeteer.default_intercept_resolution_priority.md)

</td><td>

The default cooperative request interception resolution priority

</td></tr>
<tr><td>

[KnownDevices](./puppeteer.knowndevices.md)

</td><td>

A list of devices to be used with [Page.emulate()](./puppeteer.page.emulate.md).

</td></tr>
<tr><td>

[MouseButton](./puppeteer.mousebutton.md)

</td><td>

Enum of valid mouse buttons.

</td></tr>
<tr><td>

[PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md)

</td><td>

A list of network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

</td></tr>
<tr><td>

[puppeteer](./puppeteer.puppeteer.md)

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

[ActionResult](./puppeteer.actionresult.md)

</td><td>

</td></tr>
<tr><td>

[Awaitable](./puppeteer.awaitable.md)

</td><td>

</td></tr>
<tr><td>

[AwaitableIterable](./puppeteer.awaitableiterable.md)

</td><td>

</td></tr>
<tr><td>

[AwaitablePredicate](./puppeteer.awaitablepredicate.md)

</td><td>

</td></tr>
<tr><td>

[AwaitedLocator](./puppeteer.awaitedlocator.md)

</td><td>

</td></tr>
<tr><td>

[CDPEvents](./puppeteer.cdpevents.md)

</td><td>

</td></tr>
<tr><td>

[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)

</td><td>

</td></tr>
<tr><td>

[ConsoleMessageType](./puppeteer.consolemessagetype.md)

</td><td>

The supported types for console messages.

</td></tr>
<tr><td>

[CookiePriority](./puppeteer.cookiepriority.md)

</td><td>

Represents the cookie's 'Priority' status: https://tools.ietf.org/html/draft-west-cookie-priority-00

</td></tr>
<tr><td>

[CookieSameSite](./puppeteer.cookiesamesite.md)

</td><td>

Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies

</td></tr>
<tr><td>

[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)

</td><td>

Represents the source scheme of the origin that originally set the cookie. A value of "Unset" allows protocol clients to emulate legacy cookie scope for the scheme. This is a temporary ability and it will be removed in the future.

</td></tr>
<tr><td>

[ElementFor](./puppeteer.elementfor.md)

</td><td>

</td></tr>
<tr><td>

[ErrorCode](./puppeteer.errorcode.md)

</td><td>

</td></tr>
<tr><td>

[EvaluateFunc](./puppeteer.evaluatefunc.md)

</td><td>

</td></tr>
<tr><td>

[EvaluateFuncWith](./puppeteer.evaluatefuncwith.md)

</td><td>

</td></tr>
<tr><td>

[EventsWithWildcard](./puppeteer.eventswithwildcard.md)

</td><td>

</td></tr>
<tr><td>

[EventType](./puppeteer.eventtype.md)

</td><td>

</td></tr>
<tr><td>

[ExperimentsConfiguration](./puppeteer.experimentsconfiguration.md)

</td><td>

Defines experiment options for Puppeteer.

See individual properties for more information.

</td></tr>
<tr><td>

[FlattenHandle](./puppeteer.flattenhandle.md)

</td><td>

</td></tr>
<tr><td>

[HandleFor](./puppeteer.handlefor.md)

</td><td>

</td></tr>
<tr><td>

[HandleOr](./puppeteer.handleor.md)

</td><td>

</td></tr>
<tr><td>

[Handler](./puppeteer.handler.md)

</td><td>

</td></tr>
<tr><td>

[InnerParams](./puppeteer.innerparams.md)

</td><td>

</td></tr>
<tr><td>

[KeyInput](./puppeteer.keyinput.md)

</td><td>

All the valid keys that can be passed to functions that take user input, such as [keyboard.press](./puppeteer.keyboard.press.md)

</td></tr>
<tr><td>

[KeyPressOptions](./puppeteer.keypressoptions.md)

</td><td>

</td></tr>
<tr><td>

[LocatorClickOptions](./puppeteer.locatorclickoptions.md)

</td><td>

</td></tr>
<tr><td>

[LowerCasePaperFormat](./puppeteer.lowercasepaperformat.md)

</td><td>

</td></tr>
<tr><td>

[Mapper](./puppeteer.mapper.md)

</td><td>

</td></tr>
<tr><td>

[MouseButton](./puppeteer.mousebutton.md)

</td><td>

</td></tr>
<tr><td>

[NodeFor](./puppeteer.nodefor.md)

</td><td>

</td></tr>
<tr><td>

[PaperFormat](./puppeteer.paperformat.md)

</td><td>

All the valid paper format types when printing a PDF.

</td></tr>
<tr><td>

[Permission](./puppeteer.permission.md)

</td><td>

</td></tr>
<tr><td>

[Predicate](./puppeteer.predicate.md)

</td><td>

</td></tr>
<tr><td>

[Product](./puppeteer.product.md)

</td><td>

Supported products.

</td></tr>
<tr><td>

[ProtocolLifeCycleEvent](./puppeteer.protocollifecycleevent.md)

</td><td>

</td></tr>
<tr><td>

[ProtocolType](./puppeteer.protocoltype.md)

</td><td>

</td></tr>
<tr><td>

[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)

</td><td>

</td></tr>
<tr><td>

[PuppeteerNodeLaunchOptions](./puppeteer.puppeteernodelaunchoptions.md)

</td><td>

Utility type exposed to enable users to define options that can be passed to `puppeteer.launch` without having to list the set of all types.

</td></tr>
<tr><td>

[Quad](./puppeteer.quad.md)

</td><td>

</td></tr>
<tr><td>

[ResourceType](./puppeteer.resourcetype.md)

</td><td>

Resource types for HTTPRequests as perceived by the rendering engine.

</td></tr>
<tr><td>

[TargetFilterCallback](./puppeteer.targetfiltercallback.md)

</td><td>

</td></tr>
<tr><td>

[VisibilityOption](./puppeteer.visibilityoption.md)

</td><td>

</td></tr>
</tbody></table>
