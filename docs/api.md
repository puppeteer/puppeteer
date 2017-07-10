# Puppeteer API

##### Table of Contents

<!-- toc -->

- [class: Browser](#class-browser)
  * [new Browser([options])](#new-browseroptions)
  * [browser.close()](#browserclose)
  * [browser.closePage()](#browserclosepage)
  * [browser.newPage()](#browsernewpage)
  * [browser.version()](#browserversion)
- [class: Page](#class-page)
  * [page.addScriptTag(url)](#pageaddscripttagurl)
  * [page.click()](#pageclick)
  * [page.close()](#pageclose)
  * [page.evaluate(fun, args)](#pageevaluatefun-args)
  * [page.evaluateOnInitialized(fun, args)](#pageevaluateoninitializedfun-args)
  * [page.focus()](#pagefocus)
  * [page.frames()](#pageframes)
  * [page.httpHeaders()](#pagehttpheaders)
  * [page.injectFile(filePath)](#pageinjectfilefilepath)
  * [page.mainFrame()](#pagemainframe)
  * [page.navigate(url)](#pagenavigateurl)
  * [page.plainText()](#pageplaintext)
  * [page.printToPDF(filePath[, options])](#pageprinttopdffilepath-options)
  * [page.screenshot([options])](#pagescreenshotoptions)
  * [page.setContent(html)](#pagesetcontenthtml)
  * [page.setHTTPHeaders(headers)](#pagesethttpheadersheaders)
  * [page.setInPageCallback(name, callback)](#pagesetinpagecallbackname-callback)
  * [page.setRequestInterceptor()](#pagesetrequestinterceptor)
  * [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
  * [page.setViewportSize(size)](#pagesetviewportsizesize)
  * [page.title()](#pagetitle)
  * [page.type()](#pagetype)
  * [page.uploadFile(selector, ...filePaths)](#pageuploadfileselector-filepaths)
  * [page.url()](#pageurl)
  * [page.userAgent()](#pageuseragent)
  * [page.viewportSize()](#pageviewportsize)
  * [page.waitFor(selector)](#pagewaitforselector)
- [class: Dialog](#class-dialog)
  * [dialog.accept()](#dialogaccept)
  * [dialog.dismiss()](#dialogdismiss)
  * [dialog.message()](#dialogmessage)
- [class: Frame](#class-frame)
  * [frame.childFrames()](#framechildframes)
  * [frame.evaluate(fun, args)](#frameevaluatefun-args)
  * [frame.isDetached()](#frameisdetached)
  * [frame.isMainFrame()](#frameismainframe)
  * [frame.name()](#framename)
  * [frame.parentFrame()](#frameparentframe)
  * [frame.securityOrigin()](#framesecurityorigin)
  * [frame.url()](#frameurl)
  * [frame.waitFor(selector)](#framewaitforselector)
- [class: Request](#class-request)
  * [request.response()](#requestresponse)
- [class: Response](#class-response)
  * [response.request()](#responserequest)
- [class: InterceptedRequest](#class-interceptedrequest)
  * [interceptedRequest.abort()](#interceptedrequestabort)
  * [interceptedRequest.continue()](#interceptedrequestcontinue)
  * [interceptedRequest.isHandled()](#interceptedrequestishandled)
- [class: Headers](#class-headers)
  * [headers.append()](#headersappend)
  * [headers.delete()](#headersdelete)
  * [headers.entries()](#headersentries)
  * [headers.get()](#headersget)
  * [headers.has()](#headershas)
  * [headers.keys()](#headerskeys)
  * [headers.set()](#headersset)
  * [headers.values()](#headersvalues)
- [class: Body](#class-body)
  * [body.arrayBuffer()](#bodyarraybuffer)
  * [body.bodyUsed()](#bodybodyused)
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
	- `remoteDebuggingPort` <[number]> Specify a remote debugging port to open on chromium instance. Defaults to `9229`.
	- `executablePath` <[string]> Path to a chromium executable to run instead of bundled chromium.
	- `args` <[Array]<[string]>> Additional arguments to pass to the chromium instance. List of chromium flags could be found [here](http://peter.sh/experiments/chromium-command-line-switches/).


#### browser.close()

Closes chromium application with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

#### browser.closePage()

- returns: <[Promise]>

#### browser.newPage()

- returns: <[Promise]<[Page]>>

Create a new page in browser and returns a promise which gets resolved with a Page object.

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

#### page.click()

#### page.close()

- returns: <[Promise]> Returns promise which resolves when page gets closed.

#### page.evaluate(fun, args)

- `fun` <[function]> Function to be evaluated in browser context
- `args` <[Array]<[string]>> Arguments to pass to  `fun`
- returns: <[Promise]<[Object]>> Promise which resolves to function return value

#### page.evaluateOnInitialized(fun, args)

- `fun` <[function]> Function to be evaluated in browser context
- `args` <[Array]<[string]>> Arguments to pass to  `fun`
- returns: <[Promise]<[Object]>> Promise which resolves to function

#### page.focus()

#### page.frames()

#### page.httpHeaders()

- returns: <[Object]> Key-value set of additional http headers, which will be sent with every request.


#### page.injectFile(filePath)

- `url` <[string]> Path to the javascript file to be injected into page.
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in page.

#### page.mainFrame()

#### page.navigate(url)

- `url` <[string]> URL to navigate page to
- returns: <[Promise]<[boolean]>> Promise which resolves when the page is navigated. The promise resolves to:
	- `true` if the navigation succeeds and page's `load` event is fired.
	- `false` if the navigation fails due to bad URL or SSL errors.

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
    - `quality` <[number]> The quality of the image, between 0-100. Not applicable to `.jpg` images.
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

- `url` <[string]> Name of the callback to be assigned on window object
- `callback` <[function]> Callback function which will be called in node.js
- returns: <[Promise]> Promise which resolves when callback is successfully initialized

#### page.setRequestInterceptor()

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

#### page.type()

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

Shortcut for [page.mainFrame().waitFor(selector)](#framewaitforselector).

### class: Dialog
#### dialog.accept()
#### dialog.dismiss()
#### dialog.message()

### class: Frame
#### frame.childFrames()
#### frame.evaluate(fun, args)

- `fun` <[function]> Function to be evaluated in browser context
- `args` <[Array]<[string]>> Arguments to pass to  `fun`
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
#### request.response()

### class: Response
#### response.request()

### class: InterceptedRequest
#### interceptedRequest.abort()
#### interceptedRequest.continue()
#### interceptedRequest.isHandled()

### class: Headers
#### headers.append()
#### headers.delete()
#### headers.entries()
#### headers.get()
#### headers.has()
#### headers.keys()
#### headers.set()
#### headers.values()

### class: Body
#### body.arrayBuffer()
#### body.bodyUsed()
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
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
