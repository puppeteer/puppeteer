# Puppeteer API

##### Table of Contents

<!-- toc -->

- [class: Browser](#class-browser)
  * [new Browser([options])](#new-browseroptions)
  * [browser.close()](#browserclose)
  * [browser.closePage(page)](#browserclosepagepage)
  * [browser.newPage()](#browsernewpage)
  * [browser.stderr](#browserstderr)
  * [browser.stdout](#browserstdout)
  * [browser.version()](#browserversion)
- [class: Page](#class-page)
  * [page.$(selector, pageFunction, ...args)](#pageselector-pagefunction-args)
  * [page.$$(selector, pageFunction, ...args)](#pageselector-pagefunction-args)
  * [page.addScriptTag(url)](#pageaddscripttagurl)
  * [page.click(selector)](#pageclickselector)
  * [page.close()](#pageclose)
  * [page.evaluate(pageFunction, ...args)](#pageevaluatepagefunction-args)
  * [page.evaluateOnInitialized(pageFunction, ...args)](#pageevaluateoninitializedpagefunction-args)
  * [page.focus(selector)](#pagefocusselector)
  * [page.frames()](#pageframes)
  * [page.httpHeaders()](#pagehttpheaders)
  * [page.injectFile(filePath)](#pageinjectfilefilepath)
  * [page.mainFrame()](#pagemainframe)
  * [page.navigate(url, options)](#pagenavigateurl-options)
  * [page.pdf(options)](#pagepdfoptions)
  * [page.plainText()](#pageplaintext)
  * [page.screenshot([options])](#pagescreenshotoptions)
  * [page.setContent(html)](#pagesetcontenthtml)
  * [page.setHTTPHeaders(headers)](#pagesethttpheadersheaders)
  * [page.setInPageCallback(name, callback)](#pagesetinpagecallbackname-callback)
  * [page.setRequestInterceptor(interceptor)](#pagesetrequestinterceptorinterceptor)
  * [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
  * [page.setViewportSize(size)](#pagesetviewportsizesize)
  * [page.title()](#pagetitle)
  * [page.type(text)](#pagetypetext)
  * [page.uploadFile(selector, ...filePaths)](#pageuploadfileselector-filepaths)
  * [page.url()](#pageurl)
  * [page.userAgent()](#pageuseragent)
  * [page.viewportSize()](#pageviewportsize)
  * [page.waitFor(selector)](#pagewaitforselector)
- [class: Dialog](#class-dialog)
  * [dialog.accept([promptText])](#dialogacceptprompttext)
  * [dialog.dismiss()](#dialogdismiss)
  * [dialog.message()](#dialogmessage)
  * [dialog.type](#dialogtype)
- [class: Frame](#class-frame)
  * [frame.$(selector, pageFunction, ...args)](#frameselector-pagefunction-args)
  * [frame.$$(selector, pageFunction, ...args)](#frameselector-pagefunction-args)
  * [frame.childFrames()](#framechildframes)
  * [frame.evaluate(pageFunction, ...args)](#frameevaluatepagefunction-args)
  * [frame.isDetached()](#frameisdetached)
  * [frame.isMainFrame()](#frameismainframe)
  * [frame.name()](#framename)
  * [frame.parentFrame()](#frameparentframe)
  * [frame.url()](#frameurl)
  * [frame.waitFor(selector)](#framewaitforselector)
- [class: Request](#class-request)
  * [request.headers](#requestheaders)
  * [request.method](#requestmethod)
  * [request.response()](#requestresponse)
  * [request.url](#requesturl)
- [class: Response](#class-response)
  * [response.headers](#responseheaders)
  * [response.ok](#responseok)
  * [response.request()](#responserequest)
  * [response.status](#responsestatus)
  * [response.statusText](#responsestatustext)
  * [response.url](#responseurl)
- [class: InterceptedRequest](#class-interceptedrequest)
  * [interceptedRequest.abort()](#interceptedrequestabort)
  * [interceptedRequest.continue()](#interceptedrequestcontinue)
  * [interceptedRequest.headers](#interceptedrequestheaders)
  * [interceptedRequest.isHandled()](#interceptedrequestishandled)
  * [interceptedRequest.method](#interceptedrequestmethod)
  * [interceptedRequest.postData](#interceptedrequestpostdata)
  * [interceptedRequest.url](#interceptedrequesturl)
- [class: Headers](#class-headers)
  * [headers.append(name, value)](#headersappendname-value)
  * [headers.delete(name)](#headersdeletename)
  * [headers.entries()](#headersentries)
  * [headers.get(name)](#headersgetname)
  * [headers.has(name)](#headershasname)
  * [headers.keys()](#headerskeys)
  * [headers.set(name, value)](#headerssetname-value)
  * [headers.values()](#headersvalues)
- [class: Body](#class-body)
  * [body.arrayBuffer()](#bodyarraybuffer)
  * [body.bodyUsed](#bodybodyused)
  * [body.buffer()](#bodybuffer)
  * [body.json()](#bodyjson)
  * [body.text()](#bodytext)

<!-- tocstop -->

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
})
```

#### new Browser([options])
- `options` <[Object]>  Set of configurable options to set on the browser. Can have the following fields:
	- `headless` <[boolean]> Wether to run chromium in headless mode. Defaults to `true`.
	- `executablePath` <[string]> Path to a chromium executable to run instead of bundled chromium.
	- `args` <[Array]<[string]>> Additional arguments to pass to the chromium instance. List of chromium flags could be found [here](http://peter.sh/experiments/chromium-command-line-switches/).


#### browser.close()

Closes browser with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

#### browser.closePage(page)
- `page` <[Page]> A page to be closed.
- returns: <[Promise]> Promise which resolves when the page is closed.

This is an alias for the `page.close()` method.

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

#### event: 'consolemessage'
- <[string]>

Emitted when a page calls one of console API methods, e.g. `console.log`.

#### event: 'dialog'
- <[Dialog]>

Emitted when a javascript dialog, such as `alert`, `prompt`, `confirm` or `beforeunload`, gets opened on the page. Puppeteer can take action to the dialog via dialog's [accept](#dialogacceptprompttext) or [dismiss](#dialogdismiss) methods.

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

#### page.$(selector, pageFunction, ...args)

- `selector` <[string]> A selector to be matched in the page
- `pageFunction` <[function]\([Element]\)> Function to be evaluated in-page with first element matching `selector`
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value.

Example:
```js
const outerhtml = await page.$('#box', e => e.outerHTML);
```

Shortcut for [page.mainFrame().$(selector, pageFunction, ...args)](#pageselector-fun-args).

#### page.$$(selector, pageFunction, ...args)

- `selector` <[string]> A selector to be matched in the page
- `pageFunction` <[function]\([Element]\)> Function to be evaluated in-page for every matching element.
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Array]<[Object]>>> Promise which resolves to array of function return values.

Example:
```js
const headings = await page.$$('h1,h2,h3,h4', el => el.textContent);
for (const heading of headings) console.log(heading);
```

Shortcut for [page.mainFrame().$$(selector, pageFunction, ...args)](#pageselector-fun-args).

#### page.addScriptTag(url)
- `url` <[string]> Url of a script to be added
- returns: <[Promise]> Promise which resolves as the script gets added and loads.

Adds a `<script></script>` tag to the page with the desired url. Alternatively, javascript could be injected to the page via `page.injectFile` method.

#### page.click(selector)
- `selector` <[string]> A query selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
- returns: <[Promise]> Promise which resolves when the element matching `selector` is successfully clicked. Promise gets rejected if there's no element matching `selector`.

#### page.close()
- returns: <[Promise]> Returns promise which resolves when page gets closed.

#### page.evaluate(pageFunction, ...args)
- `pageFunction` <[function]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to  `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

This is a shortcut for [page.mainFrame().evaluate()](#frameevaluatefun-args) method.

#### page.evaluateOnInitialized(pageFunction, ...args)
- `pageFunction` <[function]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function

`page.evaluateOnInitialized` adds a function which would run on every page navigation before any page's javascript. This is useful to amend javascript environment, e.g. to seed [Math.random](https://github.com/GoogleChrome/puppeteer/blob/master/examples/unrandomize.js)

#### page.focus(selector)
- `selector` <[string]> A query selector of element to focus. If there are multiple elements satisfying the selector, the first will be focused.
- returns: <[Promise]> Promise which resolves when the element matching `selector` is successfully focused. Promise gets rejected if there's no element matching `selector`.

#### page.frames()
- returns: <[Array]<[Frame]>> An array of all frames attached to the page.


#### page.httpHeaders()
- returns: <[Object]> Key-value set of additional http headers which will be sent with every request.


#### page.injectFile(filePath)
- `filePath` <[string]> Path to the javascript file to be injected into page.
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in page.

#### page.mainFrame()
- returns: <[Frame]> returns page's main frame.

Page is guaranteed to have a main frame which persists during navigations.

#### page.navigate(url, options)
- `url` <[string]> URL to navigate page to
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `maxTime` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

The `page.navigate` will throw an error if:
- there's an SSL error (e.g. in case of self-signed certificates).
- target URL is invalid.
- the `maxTime` is exceeded during navigation.

#### page.pdf(options)
- `options` <[Object]> Options object which might have the following properties:
  - `path` <[string]> The file path to save the PDF to.
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

#### page.plainText()
- returns:  <[Promise]<[string]>> Returns page's inner text.

#### page.screenshot([options])
- `options` <[Object]> Options object which might have the following properties:
    - `path` <[string]> The file path to save the image to. The screenshot type will be inferred from file extension.
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

#### page.setHTTPHeaders(headers)
- `headers` <[Object]> Key-value set of additional http headers to be sent with every request.
- returns: <[Promise]> Promise which resolves when additional headers are installed

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

#### page.setViewportSize(size)
- `size` <[Object]>  An object with two fields:
	- `width` <[number]> Specify page's width in pixels.
	- `height` <[number]> Specify page's height in pixels.
- returns: <[Promise]> Promise which resolves when the dimensions are updated.

The page's viewport size defines page's dimensions, observable from page via `window.innerWidth / window.innerHeight`. The viewport size defines a size of page
screenshot (unless a `fullPage` option is given).

In case of multiple pages in one browser, each page can have its own viewport size.

#### page.title()
- returns: <[Promise]<[string]>> Returns page's title.

#### page.type(text)
- `text` <[string]> A text to type into a focused element.
- returns: <[Promise]> Promise which resolves when the text has been successfully typed.

#### page.uploadFile(selector, ...filePaths)
- `selector` <[string]> A query selector to a file input
- `...filePaths` <[string]> Sets the value of the file input these paths
- returns: <[Promise]> Promise which resolves when the value is set.

#### page.url()
- returns: <[string]> Current page url.

This is a shortcut for [page.mainFrame().url()](#frameurl)

#### page.userAgent()
- returns: <[string]> Returns user agent.

#### page.viewportSize()
- returns: <[Object]>  An object with two fields:
	- `width` <[number]> Page's width in pixels.
	- `height` <[number]> Page's height in pixels.


#### page.waitFor(selector)
- `selector` <[string]> A query selector to wait for on the page.
- returns: <[Promise]> Promise which resolves when the element matching `selector` appears in the page.

Shortcut for [page.mainFrame().waitFor(selector)](#framewaitforselector).

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

> NOTE: Chrome Headless currently has issues with managing javascript dialogs, see [issue 13](https://github.com/GoogleChrome/puppeteer/issues/13)

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

#### frame.$(selector, pageFunction, ...args)
- `selector` <[string]> A selector to be matched in the page
- `pageFunction` <[function]\([Element]\)> Function to be evaluated with first element matching `selector`
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value.

#### frame.$$(selector, pageFunction, ...args)
- `selector` <[string]> A selector to be matched in the page
- `pageFunction` <[function]\([Element]\)> Function to be evaluted for every element matching `selector`.
- `...args` <...[string]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Array]<[Object]>>> Promise which resolves to array of function return values.

#### frame.childFrames()
- returns: <[Array]<[Frame]>>

#### frame.evaluate(pageFunction, ...args)
- `pageFunction` <[function]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to  `pageFunction`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

If the function, passed to the `page.evaluate`, returns a [Promise], then `page.evaluate` would wait for the promise to resolve and return it's value.

```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page =>
  const result = await page.evaluate(() => {
    return Promise.resolve().then(() => 8 * 7);
  });
  console.log(result); // prints "56"
  browser.close();
});
```

#### frame.isDetached()
- returns: <[boolean]>

Returns `true` if the frame has being detached, or `false` otherwise.

#### frame.isMainFrame()
- returns: <[boolean]>

Returns `true` is the frame is page's main frame, or `false` otherwise.

#### frame.name()
- returns: <[string]>

Returns frame's name as specified in the tag.

#### frame.parentFrame()
- returns: <[Frame]> Returns parent frame, if any. Detached frames and main frames return `null`.

#### frame.url()
- returns: <[string]>

Returns frame's url.

#### frame.waitFor(selector)
- `selector` <[string]> CSS selector of awaited element,
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately.


### class: Request

Whenever the page sends a request, the following events are emitted by puppeteer's page:
- ['request'](#event-request) emitted when the request is issued by the page.
- ['response'](#event-response) emitted when/if the response is received for the request.
- ['requestfinished'](#event-requestfinished) emitted when the response body is downloaded and the request is complete.

If request fails at some point, then instead of 'requestfinished' event (and possibly instead of 'response' event), the  ['requestfailed'](#event-requestfailed) event is emitted.

If request gets a 'redirect' response, the request is successfully finished with the 'requestfinished' event, and a new request is  issued to a redirected url.

[Request] class represents requests which are sent by page. [Request] implements [Body] mixin, which in case of HTTP POST requests allows clients to call `request.json()` or `request.text()` to get different representations of request's body.

#### request.headers
- <[Headers]>

Contains the associated [Headers] object of the request.

#### request.method
- <[string]>

Contains the request's method (GET, POST, etc.)


#### request.response()
- returns: <[Response]> A matching [Response] object, or `null` if the response has not been received yet.

#### request.url
- <[string]>

Contains the URL of the request.

### class: Response

[Response] class represents responses which are received by page. [Response] implements [Body] mixin, which allows clients to call `response.json()` or `response.text()` to get different representations of response body.

#### response.headers
- <[Headers]>

Contains the [Headers] object associated with the response.

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


#### response.url
- <[string]>

Contains the URL of the response.


### class: InterceptedRequest

[InterceptedRequest] represents an intercepted request, which can be mutated and either continued or aborted. [InterceptedRequest] which is not continued or aborted will be in a 'hanging' state.

#### interceptedRequest.abort()

Aborts request.

#### interceptedRequest.continue()

Continues request.

#### interceptedRequest.headers
- <[Headers]>

Contains the [Headers] object associated with the request.

Headers could be mutated with the `headers.append`, `headers.set` and other
methods. Must not be changed in response to an authChallenge.

#### interceptedRequest.isHandled()
- returns: <[boolean]> returns `true` if either `abort` or `continue` was called on the object. Otherwise, returns `false`.

#### interceptedRequest.method
- <[string]>

Contains the request's method (GET, POST, etc.)

If set this allows the request method to be overridden. Must not be changed in response to an authChallenge.

#### interceptedRequest.postData
- <[string]>

Contains `POST` data for `POST` requests.

`request.postData` is mutable and could be written to. Must not be changed in response to an authChallenge.

#### interceptedRequest.url
- <[string]>

If changed, the request url will be modified in a way that's not observable by page. Must not be changed in response to an authChallenge.

### class: Headers
#### headers.append(name, value)
- `name` <[string]> Case-insensetive header name.
- `value` <[string]> Header value

If there's already a header with name `name`, the header gets overwritten.

#### headers.delete(name)
- `name` <[string]> Case-insensetive name of the header to be deleted. If there's no header with such name, the method does nothing.

#### headers.entries()
- returns: <[iterator]> An iterator allowing to go through all key/value pairs contained in this object. Both the key and value of each pairs are [string] objects.


#### headers.get(name)
- `name` <[string]> Case-insensetive name of the header.
- returns: <[string]> Header value of `null`, if there's no such header.

#### headers.has(name)
- `name` <[string]> Case-insensetive name of the header.
- returns: <[boolean]> Returns `true` if the header with such name exists, or `false` otherwise.

#### headers.keys()
- returns: <[iterator]> an iterator allowing to go through all keys contained in this object. The keys are [string] objects.


#### headers.set(name, value)
- `name` <[string]> Case-insensetive header name.
- `value` <[string]> Header value

If there's already a header with name `name`, the header gets overwritten.

#### headers.values()
- returns: <[iterator]<[string]>> Returns an iterator allowing to go through all values contained in this object. The values are [string] objects.

### class: Body
#### body.arrayBuffer()
- returns: <Promise<[ArrayBuffer]>>


#### body.bodyUsed
- returns: <[boolean]>

#### body.buffer()
- returns: <Promise<[Buffer]>>

#### body.json()
- returns: <Promise<[Object]>>

#### body.text()
- returns: <Promise<[text]>>

[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[ArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer "ArrayBuffer"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page "Page"
[Headers]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-headers "Headers"
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
[Dialog]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-dialog  "Dialog"
