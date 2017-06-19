# Puppeteer API

- [class: Browser](#class-browser)
    - [new Browser([options])](#new-browseroptions)
    - [browser.newPage()](#browsernewpage)
    - [browser.closePage()](#browserclosepage)
    - [browser.version()](#browserversion)
    - [browser.close()](#browserclose)
- [class: Page](#class-page)
    - [page.addScriptTag(url)](#pageaddscripttagurl)
    - [page.injectFile(filePath)](#pageinjectfilefilepath)
    - [page.setInPageCallback(name, callback)](#pagesetinpagecallbackname-callback)
    - [page.setExtraHTTPHeaders(headers)](#pagesetextrahttpheadersheaders)
    - [page.extraHTTPHeaders()](#pageextrahttpheaders)
    - [page.setUserAgentOverride(userAgent)](#pagesetuseragentoverrideuseragent)
    - [page.userAgentOverride()](#pageuseragentoverride)
    - [page.url()](#pageurl)
    - [page.setContent(html)](#pagesetcontenthtml)
    - [page.navigate(url)](#pagenavigateurl)
    - [page.setViewportSize(size)](#pagesetsizesize)
    - [page.viewportSize()](#pagesize)
    - [page.evaluate(fun, args)](#pageevaluatefun-args)
    - [page.evaluateOnInitialized(fun, args)](#pageevaluateoninitializedfun-args)
    - [page.screenshot([options])](#pagescreenshottype-cliprect)
    - [page.printToPDF(filePath[, options])](#pageprinttopdffilepath-options)
    - [page.plainText()](#pageplaintext)
    - [page.title()](#pagetitle)
    - [page.close()](#pageclose)

### class: Browser

Browser manages a browser instance, creating it with a predefined
settings, opening and closing pages. Instantiating Browser class does
not necessarily result in launching browser; the instance will be launched when the need will arise.

#### new Browser([options])

- `options` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)  Set of configurable options to set on the browser. Can have the following fields:
	- `headless` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) Wether to run chromium in headless mode. Defaults to `true`.
	- `remoteDebuggingPort` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Specify a remote debugging port to open on chromium instance. Defaults to `9229`.
	- `executablePath` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Path to a chromium executable to run instead of bundled chromium.
	- `args` [&lt;Array&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) Additional arguments to pass to the chromium instance. List of chromium flags could be found [here](http://peter.sh/experiments/chromium-command-line-switches/).

#### browser.newPage()

- returns: [&lt;Promise&lt;Page&gt;&gt;](http://todo)

Create a new page in browser and returns a promise which gets resolved with a Page object.

#### browser.closePage()

- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)

#### browser.version()

- returns: [&lt;Promise&lt;string&gt;&gt;]((https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type))

#### browser.close()

Closes chromium application with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

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

- `url` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Url of a script to be added
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves as the script gets added and loads.

#### page.injectFile(filePath)

- `url` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Path to the javascript file to be injected into page.
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when file gets successfully evaluated in page.

#### page.setInPageCallback(name, callback)

- `url` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Name of the callback to be assigned on window object
- `callback` [&lt;Function&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) Callback function which will be called in node.js
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when callback is successfully initialized

#### page.setExtraHTTPHeaders(headers)

- `headers` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Key-value set of additional http headers to be sent with every request.
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when additional headers are installed

#### page.extraHTTPHeaders()

- returns: [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Key-value set of additional http headers, which will be sent with every request.

#### page.setUserAgentOverride(userAgent)

- `userAgent` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Specific user agent to use in this page
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when the user agent is set.

#### page.userAgentOverride()

- returns: [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Returns user agent override, if any.

#### page.url()

- returns: [&lt;Promise&lt;string&gt;&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Promise which resolves with the current page url.

#### page.setContent(html)

- `html` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) HTML markup to assign to the page.
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when the content is successfully assigned.

#### page.navigate(url)

- `url` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) URL to navigate page to
- returns: [&lt;Promise&lt;boolean&gt;&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) Promise which resolves when the page is navigated. The promise resolves to:
	- `true` if the navigation succeeds and page's `load` event is fired.
	- `false` if the navigation fails due to bad URL or SSL errors.

#### page.setViewportSize(size)

- `size` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)  An object with two fields:
	- `width` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Specify page's width in pixels.
	- `height` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Specify page's height in pixels.
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when the dimensions are updated.

#### page.viewportSize()

- returns: [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)  An object with two fields:
	- `width` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Page's width in pixels.
	- `height` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Page's height in pixels.

#### page.evaluate(fun, args)

- `fun` [&lt;Function&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) Function to be evaluated in browser context
- `args` [&lt;Array&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) Arguments to pass to  `fun`
- returns: [&lt;Promise&lt;Object&gt;&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves to function return value

#### page.evaluateOnInitialized(fun, args)

- `fun` [&lt;Function&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) Function to be evaluated in browser context
- `args` [&lt;Array&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) Arguments to pass to  `fun`
- returns: [&lt;Promise&lt;Object&gt;&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves to function

#### page.screenshot([options])

- `options` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Options object which might have the following properties:
    - `path` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The file path to save the image to. The screenshot type will be inferred from file extension.
    - `type` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Specify screenshot type, could be either `jpeg` or `png`.
    - `quality` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) The quality of the image, between 0-100. Not applicable to `.jpg` images.
    - `fullPage` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) When true, takes a screenshot of the full scrollable page.
    - `clip` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) An object which specifies clipping region of the page. Should have the following fields:
        - `x` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) x-coordinate of top-left corner of clip area
        - `y` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) y-coordinate of top-left corner of clip area
        - `width` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) width of clipping area
        - `height` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) height of clipping area
- returns: [&lt;Promise&lt;Buffer&gt;&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves to buffer with captured screenshot

#### page.printToPDF(filePath[, options])

- `filePath` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The file path to save the image to. The screenshot type will be inferred from file extension
- `options` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Options object which might have the following properties:
	- `scale` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
	- `displayHeaderFooter` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
	- `printBackground` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
	- `landscape` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
	- `pageRanges` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
	- `format` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
	- `width` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
	- `height` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promise which resolves when the PDF is saved.

#### page.plainText()

- returns: [&lt;Promise&lt;string&gt;&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Returns page's inner text.

#### page.title()

- returns: [&lt;Promise&lt;string&gt;&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Returns page's title.

#### page.close()

- returns: [&lt;Promise&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Returns promise which resolves when page gets closed.
