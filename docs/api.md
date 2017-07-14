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
  * [page.addScriptTag(url)](#pageaddscripttagurl)
  * [page.click(selector)](#pageclickselector)
  * [page.close()](#pageclose)
  * [page.evaluate(fun, ...args)](#pageevaluatefun-args)
  * [page.evaluateOnInitialized(fun, ...args)](#pageevaluateoninitializedfun-args)
  * [page.focus(selector)](#pagefocusselector)
  * [page.frames()](#pageframes)
  * [page.httpHeaders()](#pagehttpheaders)
  * [page.injectFile(filePath)](#pageinjectfilefilepath)
  * [page.mainFrame()](#pagemainframe)
  * [page.navigate(url, options)](#pagenavigateurl-options)
  * [page.plainText()](#pageplaintext)
  * [page.printToPDF(filePath[, options])](#pageprinttopdffilepath-options)
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
  * [frame.childFrames()](#framechildframes)
  * [frame.evaluate(fun, ...args)](#frameevaluatefun-args)
  * [frame.isDetached()](#frameisdetached)
  * [frame.isMainFrame()](#frameismainframe)
  * [frame.name()](#framename)
  * [frame.parentFrame()](#frameparentframe)
  * [frame.securityOrigin()](#framesecurityorigin)
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

#### new Browser([options])

- `options` <[Object]>  Set of configurable options to set on the browser. Can have the following fields:
	- `headless` <[boolean]> Wether to run chromium in headless mode. Defaults to `true`.
	- `executablePath` <[string]> Path to a chromium executable to run instead of bundled chromium.
	- `args` <[Array]<[string]>> Additional arguments to pass to the chromium instance. List of chromium flags could be found [here](http://peter.sh/experiments/chromium-command-line-switches/).


#### browser.close()

Closes chromium application with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

#### browser.closePage(page)

- `page` <[Page]> A page to be closed.
- returns: <[Promise]> Promise which resolves when the page is closed.

#### browser.newPage()

- returns: <[Promise]<[Page]>>

Create a new page in browser and returns a promise which gets resolved with a Page object.

#### browser.stderr
- <[stream.Readable]>

A Readable Stream that represents the browser process's stderr.

#### browser.stdout
- <[stream.Readable]>

A Readable Stream that represents the browser process's stdout.

#### browser.version()
- returns: <[Promise]<[string]>>

### class: Page

Page provides interface to interact with a tab in a browser. Pages are created by browser:

```javascript
var browser = new Browser();
browser.newPage().then(page => {
	...
});
```
Pages could be closed by `page.close()` method.

#### page.addScriptTag(url)

- `url` <[string]> Url of a script to be added
- returns: <[Promise]> Promise which resolves as the script gets added and loads.

#### page.click(selector)
- `selector` <[string]> A query selector of element to click. If there are multiple elements satisfying the selector, the first will be clicked.

#### page.close()

- returns: <[Promise]> Returns promise which resolves when page gets closed.

#### page.evaluate(fun, ...args)

- `fun` <[function]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to  `fun`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

#### page.evaluateOnInitialized(fun, ...args)

- `fun` <[function]> Function to be evaluated in browser context
- `...args` <...[string]> Arguments to pass to `fun`
- returns: <[Promise]<[Object]>> Promise which resolves to function

#### page.focus(selector)
- `selector` <[string]> A query selector of element to focus. If there are multiple elements satisfying the selector, the first will be focused.

#### page.frames()

#### page.httpHeaders()

- returns: <[Object]> Key-value set of additional http headers, which will be sent with every request.


#### page.injectFile(filePath)

- `filePath` <[string]> Path to the javascript file to be injected into page.
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in page.

#### page.mainFrame()

#### page.navigate(url, options)

- `url` <[string]> URL to navigate page to
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `maxTime` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds.
  - `waitFor` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout`ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitFor: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitFor: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

The `page.navigate` will throw an error if:
- there's an SSL error (e.g. in case of self-signed certificates).
- target URL is invalid.
- the `maxTime` is exceeded during navigation.

#### page.plainText()

- returns:  <[Promise]<[string]>> Returns page's inner text.

#### page.printToPDF(filePath[, options])

- `filePath` <[string]> The file path to save the image to. The screenshot type will be inferred from file extension
- `options` <[Object]> Options object which might have the following properties:
	- `scale` <[number]>
	- `displayHeaderFooter` <[boolean]>
	- `printBackground` <[boolean]>
	- `landscape` <[boolean]>
	- `pageRanges` <[string]>
	- `format` <[string]>
	- `width` <[number]>
	- `height` <[number]>
- returns: <[Promise]> Promise which resolves when the PDF is saved.

#### page.screenshot([options])

- `options` <[Object]> Options object which might have the following properties:
    - `path` <[string]> The file path to save the image to. The screenshot type will be inferred from file extension.
    - `type` <[string]> Specify screenshot type, could be either `jpeg` or `png`.
    - `quality` <[number]> The quality of the image, between 0-100. Not applicable to `.png` images.
    - `fullPage` <[boolean]> When true, takes a screenshot of the full scrollable page.
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
- `callback` <[function]> Callback function which will be called in node.js
- returns: <[Promise]> Promise which resolves when callback is successfully initialized

#### page.setRequestInterceptor(interceptor)
- `interceptor` <[function]> Callback function which accepts a single argument of type <[InterceptedRequest]>.

#### page.setUserAgent(userAgent)

- `userAgent` <[string]> Specific user agent to use in this page
- returns: <[Promise]> Promise which resolves when the user agent is set.

#### page.setViewportSize(size)

- `size` <[Object]>  An object with two fields:
	- `width` <[number]> Specify page's width in pixels.
	- `height` <[number]> Specify page's height in pixels.
- returns: <[Promise]> Promise which resolves when the dimensions are updated.

#### page.title()

- returns: <[Promise]<[string]>> Returns page's title.

#### page.type(text)
- `text` <[string]> A text to type into a focused element.

#### page.uploadFile(selector, ...filePaths)
- `selector` <[string]> A query selector to a file input
- `...filePaths` <[string]> Sets the value of the file input these paths
- returns: <[Promise]> Promise which resolves when the value is set.

#### page.url()

- returns: <[Promise]<[string]>> Promise which resolves with the current page url.

#### page.userAgent()

- returns: <[string]> Returns user agent.

#### page.viewportSize()

- returns: <[Object]>  An object with two fields:
	- `width` <[number]> Page's width in pixels.
	- `height` <[number]> Page's height in pixels.

#### page.waitFor(selector)

- `selector` <[string]> A query selector to wait for on the page.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately.

Shortcut for [page.mainFrame().waitFor(selector)](#framewaitforselector).

### class: Dialog
#### dialog.accept([promptText])
- `promptText` <[string]> A text to enter in prompt. Does not cause any effects if the dialog type is not prompt.

#### dialog.dismiss()

#### dialog.message()

#### dialog.type
- <[string]>

Dialog's type, could be one of the `alert`, `beforeunload`, `confirm` and `prompt`.

### class: Frame
#### frame.childFrames()
#### frame.evaluate(fun, ...args)

- `fun` <[function]> Function to be evaluated in browser context
- `...args` <[Array]<[string]>> Arguments to pass to  `fun`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

#### frame.isDetached()
#### frame.isMainFrame()
#### frame.name()
#### frame.parentFrame()
#### frame.securityOrigin()
#### frame.url()
#### frame.waitFor(selector)

- `selector` <[string]> CSS selector of awaited element,
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.


### class: Request
#### request.headers
- <[Headers]>

Contains the associated [Headers] object of the request.

#### request.method
- <[string]>

Contains the request's method (GET, POST, etc.)


#### request.response()

#### request.url
- <[string]>

Contains the URL of the request.

### class: Response

#### response.headers
- <[Headers]>

Contains the [Headers] object associated with the response.

#### response.ok
- <[boolean]>

Contains a boolean stating whether the response was successful (status in the range 200-299) or not.

#### response.request()
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

#### interceptedRequest.abort()
#### interceptedRequest.continue()
#### interceptedRequest.headers
- <[Headers]>

Contains the [Headers] object associated with the request.

#### interceptedRequest.isHandled()

#### interceptedRequest.method
- <[string]>

Contains the request's method (GET, POST, etc.)


#### interceptedRequest.postData
- <[string]>

In case of a `POST` request, contains `POST` data.

#### interceptedRequest.url
- <[string]>

Contains the URL of the request.



### class: Headers
#### headers.append(name, value)
- `name` <[string]> Case-insensetive header name.
- `value` <[string]> Header value

If there's already a header with name `name`, the header gets overwritten.

#### headers.delete(name)
- `name` <[string]> Case-insensetive name of the header to be deleted. If there's no header with such name, the method does nothing.

#### headers.entries()
#### headers.get(name)
- `name` <[string]> Case-insensetive name of the header.
- returns: <[string]> Header value of `null`, if there's no such header.

#### headers.has(name)
- `name` <[string]> Case-insensetive name of the header.
- returns: <[boolean]> Returns `true` if the header with such name exists, or `false` otherwise.

#### headers.keys()
#### headers.set(name, value)
- `name` <[string]> Case-insensetive header name.
- `value` <[string]> Header value

If there's already a header with name `name`, the header gets overwritten.

#### headers.values()

### class: Body
#### body.arrayBuffer()
#### body.bodyUsed
#### body.buffer()
#### body.json()
#### body.text()

[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
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
[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable
