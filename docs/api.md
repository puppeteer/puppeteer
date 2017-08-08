# Puppeteer API v<!-- GEN:version -->0.1.0<!-- GEN:stop-->

##### Table of Contents

<!-- toc -->

- [Puppeteer](#puppeteer)
  * [Emulation](#emulation)
  * [class: Browser](#class-browser)
    + [new Browser([options])](#new-browseroptions)
    + [browser.close()](#browserclose)
    + [browser.newPage()](#browsernewpage)
    + [browser.stderr](#browserstderr)
    + [browser.stdout](#browserstdout)
    + [browser.version()](#browserversion)
  * [class: Page](#class-page)
    + [event: 'console'](#event-console)
    + [event: 'dialog'](#event-dialog)
    + [event: 'frameattached'](#event-frameattached)
    + [event: 'framedetached'](#event-framedetached)
    + [event: 'framenavigated'](#event-framenavigated)
    + [event: 'load'](#event-load)
    + [event: 'pageerror'](#event-pageerror)
    + [event: 'request'](#event-request)
    + [event: 'requestfailed'](#event-requestfailed)
    + [event: 'requestfinished'](#event-requestfinished)
    + [event: 'response'](#event-response)
    + [page.$(selector)](#pageselector)
    + [page.addScriptTag(url)](#pageaddscripttagurl)
    + [page.close()](#pageclose)
    + [page.evaluate(pageFunction, ...args)](#pageevaluatepagefunction-args)
    + [page.evaluateOnNewDocument(pageFunction, ...args)](#pageevaluateonnewdocumentpagefunction-args)
    + [page.frames()](#pageframes)
    + [page.goBack(options)](#pagegobackoptions)
    + [page.goForward(options)](#pagegoforwardoptions)
    + [page.injectFile(filePath)](#pageinjectfilefilepath)
    + [page.keyboard](#pagekeyboard)
    + [page.mainFrame()](#pagemainframe)
    + [page.mouse](#pagemouse)
    + [page.navigate(url, options)](#pagenavigateurl-options)
    + [page.pdf(options)](#pagepdfoptions)
    + [page.plainText()](#pageplaintext)
    + [page.press(key[, options])](#pagepresskey-options)
    + [page.reload(options)](#pagereloadoptions)
    + [page.screenshot([options])](#pagescreenshotoptions)
    + [page.setContent(html)](#pagesetcontenthtml)
    + [page.setExtraHTTPHeaders(headers)](#pagesetextrahttpheadersheaders)
    + [page.setInPageCallback(name, callback)](#pagesetinpagecallbackname-callback)
    + [page.setRequestInterceptor(interceptor)](#pagesetrequestinterceptorinterceptor)
    + [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
    + [page.setViewport(viewport)](#pagesetviewportviewport)
    + [page.title()](#pagetitle)
    + [page.tracing](#pagetracing)
    + [page.type(text, options)](#pagetypetext-options)
    + [page.url()](#pageurl)
    + [page.viewport()](#pageviewport)
    + [page.waitFor(selectorOrFunctionOrTimeout[, options])](#pagewaitforselectororfunctionortimeout-options)
    + [page.waitForFunction(pageFunction[, options, ...args])](#pagewaitforfunctionpagefunction-options-args)
    + [page.waitForNavigation(options)](#pagewaitfornavigationoptions)
    + [page.waitForSelector(selector[, options])](#pagewaitforselectorselector-options)
  * [class: RemoteElement](#class-remoteelement)
    + [remoteElement.click([options])](#remoteelementclickoptions)
    + [remoteElement.eval(pageFunction, ...args)](#remoteelementevalpagefunction-args)
    + [remoteElement.focus()](#remoteelementfocus)
    + [remoteElement.hover()](#remoteelementhover)
    + [remoteElement.release()](#remoteelementrelease)
    + [remoteElement.uploadFile(...filePaths)](#remoteelementuploadfilefilepaths)
  * [class: Keyboard](#class-keyboard)
    + [keyboard.down(key[, options])](#keyboarddownkey-options)
    + [keyboard.sendCharacter(char)](#keyboardsendcharacterchar)
    + [keyboard.up(key)](#keyboardupkey)
  * [class: Mouse](#class-mouse)
    + [mouse.click(x, y, [options])](#mouseclickx-y-options)
    + [mouse.down([options])](#mousedownoptions)
    + [mouse.move(x, y)](#mousemovex-y)
    + [mouse.up([options])](#mouseupoptions)
  * [class: Tracing](#class-tracing)
    + [tracing.start(options)](#tracingstartoptions)
    + [tracing.stop()](#tracingstop)
  * [class: Dialog](#class-dialog)
    + [dialog.accept([promptText])](#dialogacceptprompttext)
    + [dialog.dismiss()](#dialogdismiss)
    + [dialog.message()](#dialogmessage)
    + [dialog.type](#dialogtype)
  * [class: Frame](#class-frame)
    + [frame.$(selector)](#frameselector)
    + [frame.addScriptTag(url)](#frameaddscripttagurl)
    + [frame.childFrames()](#framechildframes)
    + [frame.evaluate(pageFunction, ...args)](#frameevaluatepagefunction-args)
    + [frame.injectFile(filePath)](#frameinjectfilefilepath)
    + [frame.isDetached()](#frameisdetached)
    + [frame.name()](#framename)
    + [frame.parentFrame()](#frameparentframe)
    + [frame.title()](#frametitle)
    + [frame.url()](#frameurl)
    + [frame.waitFor(selectorOrFunctionOrTimeout[, options])](#framewaitforselectororfunctionortimeout-options)
    + [frame.waitForFunction(pageFunction[, options, ...args])](#framewaitforfunctionpagefunction-options-args)
    + [frame.waitForSelector(selector[, options])](#framewaitforselectorselector-options)
  * [class: Request](#class-request)
    + [request.headers](#requestheaders)
    + [request.method](#requestmethod)
    + [request.postData](#requestpostdata)
    + [request.response()](#requestresponse)
    + [request.url](#requesturl)
  * [class: Response](#class-response)
    + [response.buffer()](#responsebuffer)
    + [response.headers](#responseheaders)
    + [response.json()](#responsejson)
    + [response.ok](#responseok)
    + [response.request()](#responserequest)
    + [response.status](#responsestatus)
    + [response.statusText](#responsestatustext)
    + [response.text()](#responsetext)
    + [response.url](#responseurl)
  * [class: InterceptedRequest](#class-interceptedrequest)
    + [interceptedRequest.abort()](#interceptedrequestabort)
    + [interceptedRequest.continue([overrides])](#interceptedrequestcontinueoverrides)
    + [interceptedRequest.headers](#interceptedrequestheaders)
    + [interceptedRequest.method](#interceptedrequestmethod)
    + [interceptedRequest.postData](#interceptedrequestpostdata)
    + [interceptedRequest.url](#interceptedrequesturl)

<!-- tocstop -->

## Puppeteer

Puppeteer is a Node library which provides a high-level API to control Chromium over the DevTools Protocol.

Puppeteer provides a top-level require which has a [Browser](#class-browser) class.
The following is a typical example of using a Browser class to drive automation:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page => {
  await page.navigate('https://google.com');
  // other actions...
  browser.close();
});
```

### Emulation

Puppeteer supports device emulation with two primitives:
- [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
- [page.setViewport(viewport)](#pagesetviewportviewport)

To aid emulation, puppeteer provides a list of device descriptors which could be obtained via the `require('puppeteer/DeviceDescriptors')` command.
Below is an example of emulating iPhone 6 in puppeteer:
```js
const {Browser} = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];
const browser = new Browser();
browser.newPage().then(async page => {
  await Promise.all([
    page.setUserAgent(iPhone.userAgent),
    page.setViewport(iPhone.viewport)
  ]);
  await page.navigate('https://google.com');
  // other actions...
  browser.close();
});
```

List of all available devices is available in the source code: [DeviceDescriptors.js](https://github.com/GoogleChrome/puppeteer/blob/master/DeviceDescriptors.js).

### class: Browser

Browser manages a browser instance, creating it with a predefined
settings, opening and closing pages. Instantiating Browser class does
not necessarily result in launching browser; the instance will be launched when the need will arise.

A typical scenario of using [Browser] is opening a new page and navigating it to a desired URL:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page => {
  await page.navigate('https://example.com');
  browser.close();
});
```

#### new Browser([options])
- `options` <[Object]>  Set of configurable options to set on the browser. Can have the following fields:
  - `ignoreHTTPSErrors` <[boolean]> Whether to ignore HTTPS errors during navigation. Defaults to `false`.
  - `headless` <[boolean]> Whether to run chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Defaults to `true`.
  - `executablePath` <[string]> Path to a chromium executable to run instead of bundled chromium. If `executablePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
  - `slowMo` <[number]> Slows down Puppeteer operations by the specified amount of milliseconds. Useful
so that you can see what is going on.
  - `args` <[Array]<[string]>> Additional arguments to pass to the chromium instance. List of chromium flags can be found [here](http://peter.sh/experiments/chromium-command-line-switches/).


#### browser.close()

Closes browser with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

#### browser.newPage()
- returns: <[Promise]<[Page]>> Promise which resolves to a new [Page] object.


#### browser.stderr
- <[stream.Readable]>

A Readable Stream that represents the browser process's stderr.
For example, `stderr` could be piped into `process.stderr`:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.stderr.pipe(process.stderr);
browser.version().then(version => {
  console.log(version);
  browser.close();
});
```

#### browser.stdout
- <[stream.Readable]>

A Readable Stream that represents the browser process's stdout.
For example, `stdout` could be piped into `process.stdout`:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.stdout.pipe(process.stdout);
browser.version().then(version => {
  console.log(version);
  browser.close();
});
```

#### browser.version()
- returns: <[Promise]<[string]>> String describing browser version. For headless chromium, this is similar to `HeadlessChrome/61.0.3153.0`. For non-headless, this is `Chrome/61.0.3153.0`.

> **NOTE** the format of browser.version() is not fixed and might change with future releases of the library.

### class: Page

Page provides methods to interact with browser page. Page could be thought about as a browser tab, so one [Browser] instance might have multiple [Page] instances.

An example of creating a page, navigating it to a URL and saving screenshot as `screenshot.png`:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page =>
  await page.navigate('https://example.com');
  await page.screenshot({path: 'screenshot.png'});
  browser.close();
});
```

#### event: 'console'
- <[string]>

Emitted when a page calls one of console API methods, e.g. `console.log` or `console.dir`.

If multiple arguments are passed over to the console API call, these arguments are dispatched in an event.

An example of handling `console` event:
```js
page.on('console', (...args) => {
  for (let i =0; i < args.length; ++i)
    console.log(`${i}: ${args[i]}`);
});
page.evaluate(() => console.log(5, 'hello', {foo: 'bar'}));
```

#### event: 'dialog'
- <[Dialog]>

Emitted when a JavaScript dialog, such as `alert`, `prompt`, `confirm` or `beforeunload`, gets opened on the page. Puppeteer can take action to the dialog via dialog's [accept](#dialogacceptprompttext) or [dismiss](#dialogdismiss) methods.

#### event: 'frameattached'
- <[Frame]>

Emitted when a frame gets attached.

#### event: 'framedetached'
- <[Frame]>

Emitted when a frame gets detached.

#### event: 'framenavigated'
- <[Frame]>

Emitted when a frame committed navigation.

#### event: 'load'

Emitted when a page's `load` event was dispatched.

#### event: 'pageerror'
- <[string]>

Emitted when an unhandled exception happens on the page. The only argument of the event holds the exception message.

#### event: 'request'
- <[Request]>

Emitted when a page issues a request. The [request] object is a read-only object. In order to intercept and mutate requests, see [page.setRequestInterceptor](#pagesetrequestinterceptorinterceptor)

#### event: 'requestfailed'
- <[Request]>

Emitted when a request is failed.

#### event: 'requestfinished'
- <[Request]>

Emitted when a request is successfully finished.

#### event: 'response'
- <[Response]>

Emitted when a [response] is received.

#### page.$(selector)
- `selector` <[string]> A selector to be evaluated on the page
- returns: <[RemoteElement]>

#### page.addScriptTag(url)
- `url` <[string]> Url of a script to be added
- returns: <[Promise]> Promise which resolves as the script gets added and loads.

Adds a `<script>` tag to the frame with the desired url. Alternatively, JavaScript could be injected to the frame via [`frame.injectFile`](#frameinjectfilefilepath) method.

Shortcut for [page.mainFrame().addScriptTag(url)](#frameaddscripttagurl).

#### page.close()
- returns: <[Promise]> Returns promise which resolves when page gets closed.

#### page.evaluate(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to  `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

If the function, passed to the `page.evaluate`, returns a [Promise], then `page.evaluate` would wait for the promise to resolve and return it's value.

```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page =>
  const result = await page.evaluate(() => {
    return Promise.resolve(8 * 7);
  });
  console.log(result); // prints "56"
  browser.close();
});
```

A string can also be passed in instead of a function.

```js
console.log(await page.evaluate('1 + 2')); // prints "3"
```

Shortcut for [page.mainFrame().evaluate(pageFunction, ...args)](#frameevaluatepagefunction-args).

#### page.evaluateOnNewDocument(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function

Adds a function which would be invoked in one of the following scenarios:
- whenever the page gets navigated
- whenever the child frame gets attached or navigated. In this case, the function gets invoked in the context of the newly attached frame

The function is invoked after the document was created but before any of its scripts were run. This is useful to amend JavaScript environment, e.g. to seed [Math.random](https://github.com/GoogleChrome/puppeteer/blob/master/examples/unrandomize.js)

#### page.frames()
- returns: <[Array]<[Frame]>> An array of all frames attached to the page.

#### page.goBack(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go back, resolves to null.

Navigate to the previous page in history.

#### page.goForward(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go back, resolves to null.

Navigate to the next page in history.

#### page.injectFile(filePath)
- `filePath` <[string]> Path to the JavaScript file to be injected into frame. If `filePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in frame.

Shortcut for [page.mainFrame().injectFile(filePath)](#frameinjectfilefilepath).

#### page.keyboard

- returns: <[Keyboard]>

#### page.mainFrame()
- returns: <[Frame]> returns page's main frame.

Page is guaranteed to have a main frame which persists during navigations.

#### page.mouse

- returns: <[Mouse]>

#### page.navigate(url, options)
- `url` <[string]> URL to navigate page to
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

The `page.navigate` will throw an error if:
- there's an SSL error (e.g. in case of self-signed certificates).
- target URL is invalid.
- the `timeout` is exceeded during navigation.
- the main resource failed to load.

> **NOTE** `page.navigate` either throw or return a main resource response. The only exception is navigation to `about:blank`, which would succeed and return `null`.

#### page.pdf(options)
- `options` <[Object]> Options object which might have the following properties:
  - `path` <[string]> The file path to save the PDF to. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
  - `scale` <[number]> Scale of the webpage rendering. Defaults to `1`.
  - `displayHeaderFooter` <[boolean]> Display header and footer. Defaults to `false`.
  - `printBackground` <[boolean]> Print background graphics. Defaults to `false`.
  - `landscape` <[boolean]> Paper orientation. Defaults to `false`.
  - `pageRanges` <[string]> Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
  - `format` <[string]> Paper format. If set, takes priority over `width` or `height` options. Defaults to 'Letter'.
  - `width` <[string]> Paper width, accepts values labeled with units.
  - `height` <[string]> Paper height, accepts values labeled with units.
  - `margin` <[Object]> Paper margins, defaults to none.
    - `top` <[string]> Top margin, accepts values labeled with units.
    - `right` <[string]> Right margin, accepts values labeled with units.
    - `bottom` <[string]> Bottom margin, accepts values labeled with units.
    - `left` <[string]> Left margin, accepts values labeled with units.
- returns: <[Promise]<[Buffer]>> Promise which resolves with PDF buffer.

The `width`, `height`, and `margin` options accept values labeled with units. Unlabeled values are treated as pixels.

A few examples:
- `page.pdf({width: 100})` - prints with width set to 100 pixels
- `page.pdf({width: '100px'})` - prints with width set to 100 pixels
- `page.pdf({width: '10cm'})` - prints with width set to 10 centimeters.

All possible units are:
- `px` - pixel
- `in` - inch
- `cm` - centimeter
- `mm` - millimeter

The `format` options are:
- `Letter`: 8.5in x 11in
- `Legal`: 8.5in x 14in
- `Tabloid`: 11in x 17in
- `Ledger`: 17in x 11in
- `A0`: 33.1in x 46.8in
- `A1`: 23.4in x 33.1in
- `A2`: 16.5in x 23.4in
- `A3`: 11.7in x 16.5in
- `A4`: 8.27in x 11.7in
- `A5`: 5.83in x 8.27in

> **NOTE** Generating a pdf is currently only supported in Chrome headless.

#### page.plainText()
- returns:  <[Promise]<[string]>> Returns page's inner text.

#### page.press(key[, options])
- `key` <[string]> Name of key to press, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
- `options` <[Object]>
  - `text` <[string]> If specified, generates an input event with this text.
  - `delay` <[number]> Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
- returns: <[Promise]>

Shortcut for [`keyboard.down`](#keyboarddownkey-options) and [`keyboard.up`](#keyboardupkey).

#### page.reload(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

#### page.screenshot([options])
- `options` <[Object]> Options object which might have the following properties:
    - `path` <[string]> The file path to save the image to. The screenshot type will be inferred from file extension. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
    - `type` <[string]> Specify screenshot type, could be either `jpeg` or `png`. Defaults to 'png'.
    - `quality` <[number]> The quality of the image, between 0-100. Not applicable to `png` images.
    - `fullPage` <[boolean]> When true, takes a screenshot of the full scrollable page. Defaults to `false`.
    - `clip` <[Object]> An object which specifies clipping region of the page. Should have the following fields:
        - `x` <[number]> x-coordinate of top-left corner of clip area
        - `y` <[number]> y-coordinate of top-left corner of clip area
        - `width` <[number]> width of clipping area
        - `height` <[number]> height of clipping area
- returns: <[Promise]<[Buffer]>> Promise which resolves to buffer with captured screenshot

#### page.setContent(html)
- `html` <[string]> HTML markup to assign to the page.
- returns: <[Promise]> Promise which resolves when the content is successfully assigned.

#### page.setExtraHTTPHeaders(headers)
- `headers` <[Map]> A map of additional http headers to be sent with every request.
- returns: <[Promise]> Promise which resolves when additional headers are installed

The extra HTTP headers will be sent with every request the page initiates.

> **NOTE** page.setExtraHTTPHeaders does not guarantee the order of headers in the outgoing requests.


#### page.setInPageCallback(name, callback)
- `name` <[string]> Name of the callback to be assigned on window object
- `callback` <[function]> Callback function which will be called in puppeteer's context.
- returns: <[Promise]> Promise which resolves when callback is successfully initialized

The in-page callback allows page to asynchronously reach back to the Puppeteer.
An example of a page showing amount of CPU's:
```js
const os = require('os');
const {Browser} = require('puppeteer');
const browser = new Browser();

browser.newPage().then(async page =>
  await page.setInPageCallback('getCPUCount', () => os.cpus().length);
  await page.evaluate(async () => {
    alert(await window.getCPUCount());
  });
  browser.close();
});
```

#### page.setRequestInterceptor(interceptor)
- `interceptor` <[function]> Callback function which accepts a single argument of type <[InterceptedRequest]>.
- returns: <[Promise]> Promise which resolves when request interceptor is successfully installed on the page.

After the request interceptor is installed on the page, every request will be reported to the interceptor. The [InterceptedRequest] could be modified and then either continued via the `continue()` method, or aborted via the `abort()` method.

En example of a naive request interceptor which aborts all image requests:
```js
const {Browser} = require('puppeteer');
const browser = new Browser();

browser.newPage().then(async page =>
  await page.setRequestInterceptor(interceptedRequest => {
    if (interceptedRequest.url.endsWith('.png') || interceptedRequest.url.endsWith('.jpg'))
      interceptedRequest.abort();
    else
      interceptedRequest.continue();
  });
  await page.navigate('https://example.com');
  browser.close();
});
```

#### page.setUserAgent(userAgent)
- `userAgent` <[string]> Specific user agent to use in this page
- returns: <[Promise]> Promise which resolves when the user agent is set.

#### page.setViewport(viewport)
- `viewport` <[Object]>  An object with two fields:
	- `width` <[number]> Specify page's width in pixels.
	- `height` <[number]> Specify page's height in pixels.
	- `deviceScaleFactor` <[number]> Specify device scale factor (could be though of as dpr). Defaults to `1`.
	- `isMobile` <[boolean]> Whether the `meta viewport` tag is taken into account. Defaults to `false`.
	- `hasTouch`<[boolean]> Specify if viewport supports touch events. Defaults to `false`
	- `isLandscape` <[boolean]> Specify if viewport is in the landscape mode. Defaults to `false`.
- returns: <[Promise]> Promise which resolves when the dimensions are updated.

> **NOTE** in certain cases, setting viewport will reload the page so that the `isMobile` or `hasTouch` options will be able to interfere in project loading.

The page's viewport size defines page's dimensions, observable from page via `window.innerWidth / window.innerHeight`. The viewport size defines a size of page
screenshot (unless a `fullPage` option is given).

In case of multiple pages in one browser, each page can have its own viewport size.

#### page.title()
- returns: <[Promise]<[string]>> Returns page's title.

Shortcut for [page.mainFrame().title()](#frametitle).

#### page.tracing
- returns: <[Tracing]>

#### page.type(text, options)
- `text` <[string]> A text to type into a focused element.
- `options` <[Object]>
  - `delay` <[number]> Time to wait between key presses in milliseconds. Defaults to 0.
- returns: <[Promise]> Promise which resolves when the text has been successfully typed.

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, use [`page.press`](#pagepresskey-options).

```js
page.type('Hello'); // Types instantly
page.type('World', {delay: 100}); // Types slower, like a user
```

#### page.url()
- returns: <[string]>

This is a shortcut for [page.mainFrame().url()](#frameurl)

#### page.viewport()
- returns: <[Object]>  An object with the save fields as described in [page.setViewport](#pagesetviewportviewport)

#### page.waitFor(selectorOrFunctionOrTimeout[, options])
- `selectorOrFunctionOrTimeout` <[string]|[number]|[function]> A [selector], predicate or timeout to wait for
- `options` <[Object]> Optional waiting parameters
- returns: <[Promise]>

This method behaves differently with respect to the type of the first parameter:
- if `selectorOrFunctionOrTimeout` is a `string`, than the first argument is treated as a [selector] to wait for and the method is a shortcut for [frame.waitForSelector](#framewaitforselectorselector-options)
- if `selectorOrFunctionOrTimeout` is a `function`, than the first argument is treated as a predicate to wait for and the method is a shortcut for [frame.waitForFunction()](#framewaitforfunctionpagefunction-options-args).
- if `selectorOrFunctionOrTimeout` is a `number`, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
- otherwise, an exception is thrown

Shortcut for [page.mainFrame().waitFor(selectorOrFunctionOrTimeout[, options])](#framewaitforselectororfunctionortimeout-options).

#### page.waitForFunction(pageFunction[, options, ...args])
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `options` <[Object]> Optional waiting parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it could be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- `...args` <...[Object]> Arguments to pass to  `pageFunction`
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

The `waitForFunction` could be used to observe viewport size change:
```js
const {Browser} = require('.');
const browser = new Browser();

browser.newPage().then(async page => {
  const watchDog = page.waitForFunction('window.innerWidth < 100');
  page.setViewport({width: 50, height: 50});
  await watchDog;
  browser.close();
});
```
Shortcut for [page.mainFrame().waitForFunction(pageFunction[, options, ...args])](#framewaitforfunctionpagefunction-options-args).

#### page.waitForNavigation(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

#### page.waitForSelector(selector[, options])
- `selector` <[string]> CSS selector of awaited element,
- `options` <[Object]> Optional waiting parameters
  - `visible` <[boolean]> wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately. If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations:
```js
const {Browser} = new require('puppeteer');
const browser = new Browser();

browser.newPage().then(async page => {
  let currentURL;
  page.waitForSelector('img').then(() => console.log('First URL with image: ' + currentURL));
  for (currentURL of ['https://example.com', 'https://google.com', 'https://bbc.com'])
    await page.navigate(currentURL);
  browser.close();
});
```
Shortcut for [page.mainFrame().waitForSelector(selector[, options])](#framewaitforselectorselector-options).

### class: RemoteElement

#### remoteElement.click([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
- returns: <[Promise]>

#### remoteElement.eval(pageFunction, ...args)
- `pageFunction` <[function]\([Element])> Function to be evaluated in browser context
- `...args` <...[string]> Extra arguments to pass to  `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

If the function, passed to the `remoteElement.eval` returns a [Promise], then `remoteElement.eval` will wait for the promise to resolve and return it's value.

#### remoteElement.focus()
- returns: <[Promise]>

#### remoteElement.hover()
- returns: <[Promise]>

#### remoteElement.release()
- returns: <[Promise]>

#### remoteElement.uploadFile(...filePaths)
- `...filePaths` <[string]> Sets the value of the file input these paths. If some of the  `filePaths` are relative paths, then they are resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
- returns: <[Promise]>

### class: Keyboard

Keyboard provides an api for managing a virtual keyboard. The high level api is [`page.type`](#pageypetext), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

For finer control, you can use [`keyboard.down`](#keyboarddownkey-options), [`keyboard.up`](#keyboardupkey), and [`keyboard.sendCharacter`](#keyboardsendcharacterchar) to manually fire events as if they were generated from a real keyboard.

An example of holding down `Shift` in order to select and delete some text:
```js
page.type('Hello World!');
page.press('ArrowLeft');

page.keyboard.down('Shift');
for (let i = 0; i < ' World'.length; i++)
  page.press('ArrowLeft');
page.keyboard.up('Shift');

page.press('Backspace');
// Result text will end up saying 'Hello!'
```

#### keyboard.down(key[, options])
- `key` <[string]> Name of key to press, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
- `options` <[Object]>
  - `text` <[string]> If specified, generates an input event with this text.
- returns: <[Promise]>

Dispatches a `keydown` event.

This will not send input events unless `text` is specified.

If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`, subsequent key presses will be sent with that modifier active. To release the modifier key, use [`keyboard.up`](#keyboardupkey).

After the key is pressed once, subsequent calls to [`keyboard.down`](#keyboarddownkey-options) will have [repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) set to true. To release the key, use [`keyboard.up`](#keyboardupkey).

#### keyboard.sendCharacter(char)
- `char` <[string]> Character to send into the page.
- returns: <[Promise]>

Dispatches a `keypress` and `input` event. This does not send a `keydown` or `keyup` event.

```js
page.keyboard.sendCharacter('嗨');
```

#### keyboard.up(key)
- `key` <[string]> Name of key to release, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
- returns: <[Promise]>

Dispatches a `keyup` event.

### class: Mouse

#### mouse.click(x, y, [options])
- `x` <[number]>
- `y` <[number]>
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
- returns: <[Promise]>

Shortcut for [`mouse.move`](#mousemovexy), [`mouse.down`](#mousedownkey) and [`mouse.up`](#mouseupkey).

#### mouse.down([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1
- returns: <[Promise]>

Dispatches a `mousedown` event.

#### mouse.move(x, y)
- `x` <[number]>
- `y` <[number]>
- returns: <[Promise]>

Dispatches a `mousemove` event.

#### mouse.up([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1
- returns: <[Promise]>

Dispatches a `mouseup` event.

### class: Tracing

You can use [`tracing.start`](#tracingstartoptions) and [`tracing.stop`](#tracingstoppath) to create a trace file which can be opened in Chrome DevTools or [timeline viewer](https://chromedevtools.github.io/timeline-viewer/).

```js
await page.tracing.start({path: 'trace.json'});
await page.navigate('https://www.google.com');
await page.tracing.stop();
```

#### tracing.start(options)
- `options` <[Object]>
  - `path` <[string]> A path to write the trace file to. **required**
  - `screenshots` <[boolean]> captures screenshots in the trace.
- returns: <[Promise]>

Only one trace can be active at a time per browser.

#### tracing.stop()
- returns: <[Promise]>

### class: Dialog

[Dialog] objects are dispatched by page via the ['dialog'](#event-dialog) event.

An example of using `Dialog` class:
```js
const {Browser} = require('puppeteer');
const browser = new Browser({headless: false});
browser.newPage().then(async page => {
  page.on('dialog', dialog => {
    console.log(dialog.message());
    dialog.dismiss();
    browser.close();
  });
  page.evaluate(() => alert('1'));
});
```

#### dialog.accept([promptText])
- `promptText` <[string]> A text to enter in prompt. Does not cause any effects if the dialog's `type` is not prompt.
- returns: <[Promise]> Promise which resolves when the dialog has being accepted.

#### dialog.dismiss()
- returns: <[Promise]> Promise which resolves when the dialog has being dismissed.

#### dialog.message()
- returns: <[string]> A message displayed in the dialog.

#### dialog.type
- <[string]>

Dialog's type, could be one of the `alert`, `beforeunload`, `confirm` and `prompt`.

### class: Frame

At every point of time, page exposes its current frame tree via the [page.mainFrame()](#pagemainframe) and [frame.childFrames()](#framechildframes) methods.

[Frame] object's lifecycle is controlled by three events, dispatched on the page object:
- ['frameattached'](#event-frameattached) - fired when the frame gets attached to the page. Frame could be attached to the page only once.
- ['framenavigated'](#event-framenavigated) - fired when the frame commits navigation to a different URL.
- ['framedetached'](#event-framedetached) - fired when the frame gets detached from the page.  Frame could be detached from the page only once.

An example of dumping frame tree:

```js
const {Browser} = new require('.');
const browser = new Browser({headless: true});

browser.newPage().then(async page => {
  await page.navigate('https://www.google.com/chrome/browser/canary.html');
  dumpFrameTree(page.mainFrame(), '');
  browser.close();

  function dumpFrameTree(frame, indent) {
    console.log(indent + frame.url());
    for (let child of frame.childFrames())
      dumpFrameTree(child, indent + '  ');
  }
});
```

#### frame.$(selector)
- `selector` <[string]> A selector to be evaluated on the page
- returns: <[RemoteElement]>

#### frame.addScriptTag(url)
- `url` <[string]> Url of a script to be added
- returns: <[Promise]> Promise which resolves as the script gets added and loads.

Adds a `<script>` tag to the frame with the desired url. Alternatively, JavaScript could be injected to the frame via [`frame.injectFile`](#frameinjectfilefilepath) method.

#### frame.childFrames()
- returns: <[Array]<[Frame]>>

#### frame.evaluate(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to  `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

If the function, passed to the `page.evaluate`, returns a [Promise], then `page.evaluate` would wait for the promise to resolve and return it's value.

```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page =>
  const result = await page.evaluate(() => {
    return Promise.resolve(8 * 7);
  });
  console.log(result); // prints "56"
  browser.close();
});
```

A string can also be passed in instead of a function.

```js
console.log(await page.evaluate('1 + 2')); // prints "3"
```

#### frame.injectFile(filePath)
- `filePath` <[string]> Path to the JavaScript file to be injected into frame. If `filePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in frame.

#### frame.isDetached()
- returns: <[boolean]>

Returns `true` if the frame has being detached, or `false` otherwise.

#### frame.name()
- returns: <[string]>

Returns frame's name attribute as specified in the tag.

If the name is empty, returns the id attribute instead.

Note: This value is calculated once when the frame is created, and will not update if the attribute is changed later.

#### frame.parentFrame()
- returns: <[Frame]> Returns parent frame, if any. Detached frames and main frames return `null`.

#### frame.title()
- returns: <[Promise]<[string]>> Returns page's title.

#### frame.url()
- returns: <[string]>

Returns frame's url.

#### frame.waitFor(selectorOrFunctionOrTimeout[, options])
- `selectorOrFunctionOrTimeout` <[string]|[number]|[function]> A [selector], predicate or timeout to wait for
- `options` <[Object]> Optional waiting parameters
- returns: <[Promise]>

This method behaves differently with respect to the type of the first parameter:
- if `selectorOrFunctionOrTimeout` is a `string`, than the first argument is treated as a [selector] to wait for and the method is a shortcut for [frame.waitForSelector](#framewaitforselectorselector-options)
- if `selectorOrFunctionOrTimeout` is a `function`, than the first argument is treated as a predicate to wait for and the method is a shortcut for [frame.waitForFunction()](#framewaitforfunctionpagefunction-options-args).
- if `selectorOrFunctionOrTimeout` is a `number`, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
- otherwise, an exception is thrown


#### frame.waitForFunction(pageFunction[, options, ...args])
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `options` <[Object]> Optional waiting parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it could be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- `...args` <...[Object]> Arguments to pass to  `pageFunction`
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

The `waitForFunction` could be used to observe viewport size change:
```js
const {Browser} = require('.');
const browser = new Browser();

browser.newPage().then(async page => {
  const watchDog = page.waitForFunction('window.innerWidth < 100');
  page.setViewport({width: 50, height: 50});
  await watchDog;
  browser.close();
});
```

#### frame.waitForSelector(selector[, options])
- `selector` <[string]> CSS selector of awaited element,
- `options` <[Object]> Optional waiting parameters
  - `visible` <[boolean]> wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately. If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations:
```js
const {Browser} = new require('puppeteer');
const browser = new Browser();

browser.newPage().then(async page => {
  let currentURL;
  page.waitForSelector('img').then(() => console.log('First URL with image: ' + currentURL));
  for (currentURL of ['https://example.com', 'https://google.com', 'https://bbc.com'])
    await page.navigate(currentURL);
  browser.close();
});
```

### class: Request

Whenever the page sends a request, the following events are emitted by puppeteer's page:
- ['request'](#event-request) emitted when the request is issued by the page.
- ['response'](#event-response) emitted when/if the response is received for the request.
- ['requestfinished'](#event-requestfinished) emitted when the response body is downloaded and the request is complete.

If request fails at some point, then instead of 'requestfinished' event (and possibly instead of 'response' event), the  ['requestfailed'](#event-requestfailed) event is emitted.

If request gets a 'redirect' response, the request is successfully finished with the 'requestfinished' event, and a new request is  issued to a redirected url.

[Request] class represents requests which are sent by page. [Request] implements [Body] mixin, which in case of HTTP POST requests allows clients to call `request.json()` or `request.text()` to get different representations of request's body.

#### request.headers
- <[Map]> A map of HTTP headers associated with the request.

#### request.method
- <[string]>

Contains the request's method (GET, POST, etc.)

#### request.postData
- <[string]>

Contains the request's post body, if any.

#### request.response()
- returns: <[Response]> A matching [Response] object, or `null` if the response has not been received yet.

#### request.url
- <[string]>

Contains the URL of the request.

### class: Response

[Response] class represents responses which are received by page. [Response] implements [Body] mixin, which allows clients to call `response.json()` or `response.text()` to get different representations of response body.

#### response.buffer()
- returns: <Promise<[Buffer]>> Promise which resolves to a buffer with response body.

#### response.headers
- <[Map]> A map of HTTP headers associated with the response.

#### response.json()
- returns: <Promise<[Object]>> Promise which resolves to a JSON representation of response body.

This method will throw if the response body is not parsable via `JSON.parse`.

#### response.ok
- <[boolean]>

Contains a boolean stating whether the response was successful (status in the range 200-299) or not.

#### response.request()
- returns: <[Request]> A matching [Request] object.

#### response.status
- <[number]>

Contains the status code of the response (e.g., 200 for a success).

#### response.statusText
- <[string]>

Contains the status message corresponding to the status code (e.g., OK for 200).

#### response.text()
- returns: <Promise<[text]>> Promise which resolves to a text representation of response body.

#### response.url
- <[string]>

Contains the URL of the response.


### class: InterceptedRequest

[InterceptedRequest] represents an intercepted request, which can be either continued or aborted. [InterceptedRequest] which is not continued or aborted will be in a 'hanging' state.

#### interceptedRequest.abort()

Aborts request.

#### interceptedRequest.continue([overrides])
- `overrides` <[Object]> Optional request overwrites, which could be one of the following:
  - `url` <[string]> If set, the request url will be changed
  - `method` <[string]> If set changes the request method (e.g. `GET` or `POST`)
  - `postData` <[string]> If set changes the post data of request
  - `headers` <[Map]> If set changes the request HTTP headers

Continues request with optional request overrides.

#### interceptedRequest.headers
- <[Map]> A map of HTTP headers associated with the request.

#### interceptedRequest.method
- <[string]>

Contains the request's method (GET, POST, etc.)


#### interceptedRequest.postData
- <[string]>

Contains `POST` data for `POST` requests.

#### interceptedRequest.url
- <[string]>


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page "Page"
[InterceptedRequest]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-interceptedrequest "Page"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable "stream.Readable"
[Frame]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-frame "Frame"
[iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols "Iterator"
[Response]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-response  "Response"
[Request]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-request  "Request"
[Browser]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser  "Browser"
[Body]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-body  "Body"
[Element]: https://developer.mozilla.org/en-US/docs/Web/API/element "Element"
[Keyboard]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-keyboard "Keyboard"
[Dialog]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-dialog  "Dialog"
[Mouse]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-mouse "Mouse"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"
[Tracing]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-tracing "Tracing"
[RemoteElement]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-remoteelement "RemoteElement"
