##### Released API: [v0.11.0](https://github.com/GoogleChrome/puppeteer/blob/v0.11.0/docs/api.md) | [v0.10.2](https://github.com/GoogleChrome/puppeteer/blob/v0.10.2/docs/api.md) | [v0.10.1](https://github.com/GoogleChrome/puppeteer/blob/v0.10.1/docs/api.md) | [v0.10.0](https://github.com/GoogleChrome/puppeteer/blob/v0.10.0/docs/api.md) | [v0.9.0](https://github.com/GoogleChrome/puppeteer/blob/v0.9.0/docs/api.md)

# Puppeteer API v<!-- GEN:version -->0.12.0-alpha<!-- GEN:stop-->

##### Table of Contents

<!-- toc -->

- [Puppeteer](#puppeteer)
  * [Environment Variables](#environment-variables)
  * [class: Puppeteer](#class-puppeteer)
    + [puppeteer.connect(options)](#puppeteerconnectoptions)
    + [puppeteer.executablePath()](#puppeteerexecutablepath)
    + [puppeteer.launch([options])](#puppeteerlaunchoptions)
  * [class: Browser](#class-browser)
    + [browser.close()](#browserclose)
    + [browser.newPage()](#browsernewpage)
    + [browser.version()](#browserversion)
    + [browser.wsEndpoint()](#browserwsendpoint)
  * [class: Page](#class-page)
    + [event: 'console'](#event-console)
    + [event: 'dialog'](#event-dialog)
    + [event: 'error'](#event-error)
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
    + [page.$$(selector)](#pageselector)
    + [page.$eval(selector, pageFunction[, ...args])](#pageevalselector-pagefunction-args)
    + [page.addScriptTag(url)](#pageaddscripttagurl)
    + [page.addStyleTag(url)](#pageaddstyletagurl)
    + [page.authenticate(credentials)](#pageauthenticatecredentials)
    + [page.click(selector[, options])](#pageclickselector-options)
    + [page.close()](#pageclose)
    + [page.content()](#pagecontent)
    + [page.cookies(...urls)](#pagecookiesurls)
    + [page.deleteCookie(...cookies)](#pagedeletecookiecookies)
    + [page.emulate(options)](#pageemulateoptions)
    + [page.emulateMedia(mediaType)](#pageemulatemediamediatype)
    + [page.evaluate(pageFunction, ...args)](#pageevaluatepagefunction-args)
    + [page.evaluateOnNewDocument(pageFunction, ...args)](#pageevaluateonnewdocumentpagefunction-args)
    + [page.exposeFunction(name, puppeteerFunction)](#pageexposefunctionname-puppeteerfunction)
    + [page.focus(selector)](#pagefocusselector)
    + [page.frames()](#pageframes)
    + [page.goBack(options)](#pagegobackoptions)
    + [page.goForward(options)](#pagegoforwardoptions)
    + [page.goto(url, options)](#pagegotourl-options)
    + [page.hover(selector)](#pagehoverselector)
    + [page.injectFile(filePath)](#pageinjectfilefilepath)
    + [page.keyboard](#pagekeyboard)
    + [page.mainFrame()](#pagemainframe)
    + [page.mouse](#pagemouse)
    + [page.pdf(options)](#pagepdfoptions)
    + [page.plainText()](#pageplaintext)
    + [page.press(key[, options])](#pagepresskey-options)
    + [page.reload(options)](#pagereloadoptions)
    + [page.screenshot([options])](#pagescreenshotoptions)
    + [page.select(selector, ...values)](#pageselectselector-values)
    + [page.setContent(html)](#pagesetcontenthtml)
    + [page.setCookie(...cookies)](#pagesetcookiecookies)
    + [page.setExtraHTTPHeaders(headers)](#pagesetextrahttpheadersheaders)
    + [page.setJavaScriptEnabled(enabled)](#pagesetjavascriptenabledenabled)
    + [page.setRequestInterceptionEnabled(value)](#pagesetrequestinterceptionenabledvalue)
    + [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
    + [page.setViewport(viewport)](#pagesetviewportviewport)
    + [page.tap(selector)](#pagetapselector)
    + [page.title()](#pagetitle)
    + [page.touchscreen](#pagetouchscreen)
    + [page.tracing](#pagetracing)
    + [page.type(text, options)](#pagetypetext-options)
    + [page.url()](#pageurl)
    + [page.viewport()](#pageviewport)
    + [page.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])](#pagewaitforselectororfunctionortimeout-options-args)
    + [page.waitForFunction(pageFunction[, options[, ...args]])](#pagewaitforfunctionpagefunction-options-args)
    + [page.waitForNavigation(options)](#pagewaitfornavigationoptions)
    + [page.waitForSelector(selector[, options])](#pagewaitforselectorselector-options)
  * [class: Keyboard](#class-keyboard)
    + [keyboard.down(key[, options])](#keyboarddownkey-options)
    + [keyboard.sendCharacter(char)](#keyboardsendcharacterchar)
    + [keyboard.up(key)](#keyboardupkey)
  * [class: Mouse](#class-mouse)
    + [mouse.click(x, y, [options])](#mouseclickx-y-options)
    + [mouse.down([options])](#mousedownoptions)
    + [mouse.move(x, y, [options])](#mousemovex-y-options)
    + [mouse.up([options])](#mouseupoptions)
  * [class: Touchscreen](#class-touchscreen)
    + [touchscreen.tap(x, y)](#touchscreentapx-y)
  * [class: Tracing](#class-tracing)
    + [tracing.start(options)](#tracingstartoptions)
    + [tracing.stop()](#tracingstop)
  * [class: Dialog](#class-dialog)
    + [dialog.accept([promptText])](#dialogacceptprompttext)
    + [dialog.defaultValue()](#dialogdefaultvalue)
    + [dialog.dismiss()](#dialogdismiss)
    + [dialog.message()](#dialogmessage)
    + [dialog.type](#dialogtype)
  * [class: ConsoleMessage](#class-consolemessage)
    + [consoleMessage.args](#consolemessageargs)
    + [consoleMessage.text](#consolemessagetext)
    + [consoleMessage.type](#consolemessagetype)
  * [class: Frame](#class-frame)
    + [frame.$(selector)](#frameselector)
    + [frame.$$(selector)](#frameselector)
    + [frame.$eval(selector, pageFunction[, ...args])](#frameevalselector-pagefunction-args)
    + [frame.addScriptTag(url)](#frameaddscripttagurl)
    + [frame.addStyleTag(url)](#frameaddstyletagurl)
    + [frame.childFrames()](#framechildframes)
    + [frame.evaluate(pageFunction, ...args)](#frameevaluatepagefunction-args)
    + [frame.injectFile(filePath)](#frameinjectfilefilepath)
    + [frame.isDetached()](#frameisdetached)
    + [frame.name()](#framename)
    + [frame.parentFrame()](#frameparentframe)
    + [frame.title()](#frametitle)
    + [frame.url()](#frameurl)
    + [frame.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])](#framewaitforselectororfunctionortimeout-options-args)
    + [frame.waitForFunction(pageFunction[, options[, ...args]])](#framewaitforfunctionpagefunction-options-args)
    + [frame.waitForSelector(selector[, options])](#framewaitforselectorselector-options)
  * [class: ElementHandle](#class-elementhandle)
    + [elementHandle.click([options])](#elementhandleclickoptions)
    + [elementHandle.dispose()](#elementhandledispose)
    + [elementHandle.hover()](#elementhandlehover)
    + [elementHandle.tap()](#elementhandletap)
    + [elementHandle.uploadFile(...filePaths)](#elementhandleuploadfilefilepaths)
  * [class: Request](#class-request)
    + [request.abort()](#requestabort)
    + [request.continue([overrides])](#requestcontinueoverrides)
    + [request.headers](#requestheaders)
    + [request.method](#requestmethod)
    + [request.postData](#requestpostdata)
    + [request.resourceType](#requestresourcetype)
    + [request.response()](#requestresponse)
    + [request.url](#requesturl)
  * [class: Response](#class-response)
    + [response.buffer()](#responsebuffer)
    + [response.headers](#responseheaders)
    + [response.json()](#responsejson)
    + [response.ok](#responseok)
    + [response.request()](#responserequest)
    + [response.status](#responsestatus)
    + [response.text()](#responsetext)
    + [response.url](#responseurl)

<!-- tocstop -->

## Puppeteer

Puppeteer is a Node library which provides a high-level API to control Chromium over the DevTools Protocol.

### Environment Variables

Puppeteer looks for certain [environment variables](https://en.wikipedia.org/wiki/Environment_variable) to aid its operations. These variables could be either set in the environment or in the [npm config](https://docs.npmjs.com/cli/config).

- `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` - defines HTTP proxy settings that are used to download and run Chromium.
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - do not download bundled Chromium during installation step.

### class: Puppeteer

Puppeteer module provides a method to launch a Chromium instance.
The following is a typical example of using a Puppeteer to drive automation:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
});
```

#### puppeteer.connect(options)
- `options` <[Object]>
  - `browserWSEndpoint` <[string]> a [browser websocket endpoint](#browserwsendpoint) to connect to.
  - `ignoreHTTPSErrors` <[boolean]> Whether to ignore HTTPS errors during navigation. Defaults to `false`.
- returns: <[Promise]<[Browser]>>

This methods attaches Puppeteer to an existing Chromium instance.

#### puppeteer.executablePath()
- returns: <[string]> A path where Puppeteer expects to find bundled Chromium. Chromium might not exist there if the download was skipped with [`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`](#environment-variables).

#### puppeteer.launch([options])
- `options` <[Object]>  Set of configurable options to set on the browser. Can have the following fields:
  - `ignoreHTTPSErrors` <[boolean]> Whether to ignore HTTPS errors during navigation. Defaults to `false`.
  - `headless` <[boolean]> Whether to run Chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Defaults to `true`.
  - `executablePath` <[string]> Path to a Chromium executable to run instead of bundled Chromium. If `executablePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
  - `slowMo` <[number]> Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on.
  - `args` <[Array]<[string]>> Additional arguments to pass to the Chromium instance. List of Chromium flags can be found [here](http://peter.sh/experiments/chromium-command-line-switches/).
  - `handleSIGINT` <[boolean]> Close chrome process on Ctrl-C. Defaults to `true`.
  - `timeout` <[number]> Maximum time in milliseconds to wait for the Chrome instance to start. Defaults to `30000` (30 seconds). Pass `0` to disable timeout.
  - `dumpio` <[boolean]> Whether to pipe browser process stdout and stderr into `process.stdout` and `process.stderr`. Defaults to `false`.
  - `userDataDir` <[string]> Path to a [User Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md).
  - `env` <[Object]> Specify environment variables that will be visible to Chromium. Defaults to `process.env`.
- returns: <[Promise]<[Browser]>> Promise which resolves to browser instance.

The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.

> **NOTE** Puppeteer works best with the version of Chromium it is bundled with. There is no guarantee it will work with any other version. Use `executablePath` option with extreme caution.  If Google Chrome (rather than Chromium) is preferred, a [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested.

### class: Browser

A Browser is created when Puppeteer connects to a Chromium instance, either through [`puppeteer.launch`](#puppeteerlaunchoptions) or [`puppeteer.connect`](#puppeteerconnectoptions).

An example of using a [Browser] to create a [Page]:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await browser.close();
});
```

#### browser.close()
- returns: <[Promise]>

Closes browser with all the pages (if any were opened). The browser object itself is considered to be disposed and could not be used anymore.

#### browser.newPage()
- returns: <[Promise]<[Page]>> Promise which resolves to a new [Page] object.

#### browser.version()
- returns: <[Promise]<[string]>> For headless Chromium, this is similar to `HeadlessChrome/61.0.3153.0`. For non-headless, this is similar to `Chrome/61.0.3153.0`.

> **NOTE** the format of browser.version() might change with future releases of Chromium.

#### browser.wsEndpoint()
- returns: <[string]> Browser websocket url.

Browser websocket endpoint which could be used as an argument to
[puppeteer.connect](#puppeteerconnectoptions). The format is `ws://${host}:${port}/devtools/browser/<id>`

You can find the `webSocketDebuggerUrl` from `http://${host}:${port}/json/version`. Learn more about the [devtools protocol](https://chromedevtools.github.io/devtools-protocol) and the [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target).

### class: Page

Page provides methods to interact with a single tab in Chromium. One [Browser] instance might have multiple [Page] instances.

This example creates a page, navigates it to a URL, and then saves a screenshot:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'screenshot.png'});
  await browser.close();
});
```

#### event: 'console'
- <[ConsoleMessage]>

Emitted when JavaScript within the page calls one of console API methods, e.g. `console.log` or `console.dir`. Also emitted if the page throws an error or a warning.

The arguments passed into `console.log` appear as arguments on the event handler.

An example of handling `console` event:
```js
page.on('console', msg => {
  for (let i = 0; i < msg.args.length; ++i)
    console.log(`${i}: ${msg.args[i]}`);
});
page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));
```

#### event: 'dialog'
- <[Dialog]>

Emitted when a JavaScript dialog appears, such as `alert`, `prompt`, `confirm` or `beforeunload`. Puppeteer can respond to the dialog via [Dialog]'s [accept](#dialogacceptprompttext) or [dismiss](#dialogdismiss) methods.

#### event: 'error'
- <[Error]>

Emitted when the page crashes.

> **NOTE** `error` event has a special meaning in Node, see [error events](https://nodejs.org/api/events.html#events_error_events) for details.

#### event: 'frameattached'
- <[Frame]>

Emitted when a frame is attached.

#### event: 'framedetached'
- <[Frame]>

Emitted when a frame is detached.

#### event: 'framenavigated'
- <[Frame]>

Emitted when a frame is navigated to a new url.

#### event: 'load'

Emitted when the JavaScript [`load`](https://developer.mozilla.org/en-US/docs/Web/Events/load) event is dispatched.

#### event: 'pageerror'
- <[string]> The exception message

Emitted when an uncaught exception happens within the page.

#### event: 'request'
- <[Request]>

Emitted when a page issues a request. The [request] object is read-only.
In order to intercept and mutate requests, see `page.setRequestInterceptionEnabled`.

#### event: 'requestfailed'
- <[Request]>

Emitted when a request fails, for example by timing out.

#### event: 'requestfinished'
- <[Request]>

Emitted when a request finishes successfully.

#### event: 'response'
- <[Response]>

Emitted when a [response] is received.

#### page.$(selector)
- `selector` <[string]> A [selector] to query page for
- returns: <[Promise]<[ElementHandle]>>

The method runs `document.querySelector` within the page. If no element matches the selector, the return value resolve to `null`.

Shortcut for [page.mainFrame().$(selector)](#frameselector).

#### page.$$(selector)
- `selector` <[string]> A [selector] to query page for
- returns: <[Promise]<[Array]<[ElementHandle]>>>

The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolve to `[]`.

Shortcut for [page.mainFrame().$$(selector)](#frameselector-1).

#### page.$eval(selector, pageFunction[, ...args])
- `selector` <[string]> A [selector] to query page for
- `pageFunction` <[function]> Function to be evaluated in browser context
- `...args` <...[Serializable]|[ElementHandle]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Serializable]>> Promise which resolves to the return value of `pageFunction`

This method runs `document.querySelector` within the page and passes it as the first argument to `pageFunction`. If there's no element matching `selector`, the method throws an error.

If `pageFunction` returns a [Promise], then `page.$eval` would wait for the promise to resolve and return it's value.

Examples:
```js
const searchValue = await page.$eval('#search', el => el.value);
const preloadHref = await page.$eval('link[rel=preload]', el => el.href);
const html = await page.$eval('.main-container', e => e.outerHTML);
```

Shortcut for [page.mainFrame().$eval(selector, pageFunction)](#frameevalselector-pagefunction-args).

#### page.addScriptTag(url)
- `url` <[string]> Url of the `<script>` tag
- returns: <[Promise]> which resolves when the script's onload fires.

Adds a `<script>` tag into the page with the desired url. Alternatively, a local JavaScript file could be injected via [`page.injectFile`](#pageinjectfilefilepath) method.

Shortcut for [page.mainFrame().addScriptTag(url)](#frameaddscripttagurl).

#### page.addStyleTag(url)
- `url` <[string]> Url of the `<link>` tag
- returns: <[Promise]> which resolves when the stylesheet's onload fires.

Adds a `<link rel="stylesheet">` tag into the page with the desired url.

Shortcut for [page.mainFrame().addStyleTag(url)](#frameaddstyletagurl).

#### page.authenticate(credentials)
- `credentials` <[Object]>
  - `username` <[string]>
  - `password` <[string]>
- returns: <[Promise]>

Provide credentials for [http authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication).

To disable authentication, pass `null`.

#### page.click(selector[, options])
- `selector` <[string]> A [selector] to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
- returns: <[Promise]> Promise which resolves when the element matching `selector` is successfully clicked. The Promise will be rejected if there is no element matching `selector`.

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [page.mouse](#pagemouse) to click in the center of the element.
If there's no element matching `selector`, the method throws an error.

#### page.close()
- returns: <[Promise]>

#### page.content()
- returns: <[Promise]<[String]>>

Gets the full HTML contents of the page, including the doctype.

#### page.cookies(...urls)
- `...urls` <...[string]>
- returns: <[Promise]<[Array]<[Object]>>>
  - `name` <[string]>
  - `value` <[string]>
  - `domain` <[string]>
  - `path` <[string]>
  - `expires` <[number]> Unix time in seconds.
  - `httpOnly` <[boolean]>
  - `secure` <[boolean]>
  - `sameSite` <[string]> `"Strict"` or `"Lax"`.

If no URLs are specified, this method returns cookies for the current page URL.
If URLs are specified, only cookies for those URLs are returned.

#### page.deleteCookie(...cookies)
- `...cookies` <...[Object]>
  - `name` <[string]> **required**
  - `url` <[string]>
  - `domain` <[string]>
  - `path` <[string]>
  - `secure` <[boolean]>
- returns: <[Promise]>

#### page.emulate(options)
- `options` <[Object]>
  - `viewport` <[Object]>
    - `width` <[number]> page width in pixels.
    - `height` <[number]> page height in pixels.
    - `deviceScaleFactor` <[number]> Specify device scale factor (could be thought of as dpr). Defaults to `1`.
    - `isMobile` <[boolean]> Whether the `meta viewport` tag is taken into account. Defaults to `false`.
    - `hasTouch`<[boolean]> Specifies if viewport supports touch events. Defaults to `false`
    - `isLandscape` <[boolean]> Specifies if viewport is in landscape mode. Defaults to `false`.
  - `userAgent` <[string]>
- returns: <[Promise]>

Emulates given device metrics and user agent. This method is a shortcut for calling two methods:
- [page.setUserAgent(userAgent)](#pagesetuseragentuseragent)
- [page.setViewport(viewport)](#pagesetviewportviewport)

To aid emulation, puppeteer provides a list of device descriptors which could be obtained via the `require('puppeteer/DeviceDescriptors')` command.
Below is an example of emulating an iPhone 6 in puppeteer:
```js
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
});
```

List of all available devices is available in the source code: [DeviceDescriptors.js](https://github.com/GoogleChrome/puppeteer/blob/master/DeviceDescriptors.js).

#### page.emulateMedia(mediaType)
  - `mediaType` <[string]> Changes the CSS media type of the page. The only allowed values are `'screen'`, `'print'` and `null`. Passing `null` disables media emulation.
  - returns: <[Promise]>

#### page.evaluate(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in the page context
- `...args` <...[Serializable]|[ElementHandle]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Serializable]>> Resolves to the return value of `pageFunction`

If the function, passed to the `page.evaluate`, returns a [Promise], then `page.evaluate` would wait for the promise to resolve and return it's value.

```js
const result = await page.evaluate(() => {
  return Promise.resolve(8 * 7);
});
console.log(result); // prints "56"
```

A string can also be passed in instead of a function.

```js
console.log(await page.evaluate('1 + 2')); // prints "3"
```

[ElementHandle] instances could be passed as arguments to the `page.evaluate`:
```js
const bodyHandle = await page.$('body');
const html = await page.evaluate(body => body.innerHTML, bodyHandle);
await bodyHandle.dispose();
```

Shortcut for [page.mainFrame().evaluate(pageFunction, ...args)](#frameevaluatepagefunction-args).

#### page.evaluateOnNewDocument(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `...args` <...[Serializable]> Arguments to pass to `pageFunction`
- returns: <[Promise]>

Adds a function which would be invoked in one of the following scenarios:
- whenever the page is navigated
- whenever the child frame is attached or navigated. In this case, the function is invoked in the context of the newly attached frame

The function is invoked after the document was created but before any of its scripts were run. This is useful to amend JavaScript environment, e.g. to seed `Math.random`.

#### page.exposeFunction(name, puppeteerFunction)
- `name` <[string]> Name of the function on the window object
- `puppeteerFunction` <[function]> Callback function which will be called in Puppeteer's context.
- returns: <[Promise]>

The method adds a function called `name` on the page's `window` object.
When called, the function executes `puppeteerFunction` in node.js and returns a [Promise] which resolves to the return value of `puppeteerFunction`.

If the `puppeteerFunction` returns a [Promise], it will be awaited.

> **NOTE** Functions installed via `page.exposeFunction` survive navigations.

An example of adding an `md5` function into the page:
```js
const puppeteer = require('puppeteer');
const crypto = require('crypto');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text));
  await page.exposeFunction('md5', text =>
    crypto.createHash('md5').update(text).digest('hex')
  );
  await page.evaluate(async () => {
    // use window.md5 to compute hashes
    const myString = 'PUPPETEER';
    const myHash = await window.md5(myString);
    console.log(`md5 of ${myString} is ${myHash}`);
  });
  await browser.close();
});
```

An example of adding a `window.readfile` function into the page:

```js
const puppeteer = require('puppeteer');
const fs = require('fs');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text));
  await page.exposeFunction('readfile', async filePath => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, text) => {
        if (err)
          reject(err);
        else
          resolve(text);
      });
    });
  });
  await page.evaluate(async () => {
    // use window.readfile to read contents of a file
    const content = await window.readfile('/etc/hosts');
    console.log(content);
  });
  await browser.close();
});

```

#### page.focus(selector)
- `selector` <[string]> A [selector] of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
- returns: <[Promise]> Promise which resolves when the element matching `selector` is successfully focused. The promise will be rejected if there is no element matching `selector`.

This method fetches an element with `selector` and focuses it.
If there's no element matching `selector`, the method throws an error.

#### page.frames()
- returns: <[Array]<[Frame]>> An array of all frames attached to the page.

#### page.goBack(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout.
  - `waitUntil` <[string]> When to consider a navigation finished, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go back, resolves to null.

Navigate to the previous page in history.

#### page.goForward(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If
can not go back, resolves to null.

Navigate to the next page in history.

#### page.goto(url, options)
- `url` <[string]> URL to navigate page to. The url should include scheme, e.g. `https://`.
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter. Defaults to 2.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter. Defaults to 1000 ms.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

The `page.goto` will throw an error if:
- there's an SSL error (e.g. in case of self-signed certificates).
- target URL is invalid.
- the `timeout` is exceeded during navigation.
- the main resource failed to load.

> **NOTE** `page.goto` either throw or return a main resource response. The only exception is navigation to `about:blank`, which would succeed and return `null`.

> **NOTE** Headless mode doesn't support navigating to a PDF document. See the [upstream issue](https://bugs.chromium.org/p/chromium/issues/detail?id=761295).

#### page.hover(selector)
- `selector` <[string]> A [selector] to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered.
- returns: <[Promise]> Promise which resolves when the element matching `selector` is successfully hovered. Promise gets rejected if there's no element matching `selector`.

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [page.mouse](#pagemouse) to hover over the center of the element.
If there's no element matching `selector`, the method throws an error.

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

#### page.pdf(options)
- `options` <[Object]> Options object which might have the following properties:
  - `path` <[string]> The file path to save the PDF to. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd). If no path is provided, the PDF won't be saved to the disk.
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

> **NOTE** Generating a pdf is currently only supported in Chrome headless.

`page.pdf()` generates a pdf of the page with `print` css media. To generate a pdf with `screen` media, call [page.emulateMedia('screen')](#pageemulatemediamediatype) before calling `page.pdf()`:

```js
// Generates a PDF with 'screen' media type.
await page.emulateMedia('screen');
await page.pdf({path: 'page.pdf'});
```

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

#### page.press(key[, options])
- `key` <[string]> Name of key to press, such as `ArrowLeft`. See [KeyboardEvent.key](https://www.w3.org/TR/uievents-key/)
- `options` <[Object]>
  - `text` <[string]> If specified, generates an input event with this text.
  - `delay` <[number]> Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
- returns: <[Promise]>

Shortcut for [`keyboard.down`](#keyboarddownkey-options) and [`keyboard.up`](#keyboardupkey).

#### page.reload(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

#### page.screenshot([options])
- `options` <[Object]> Options object which might have the following properties:
    - `path` <[string]> The file path to save the image to. The screenshot type will be inferred from file extension. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd). If no path is provided, the image won't be saved to the disk.
    - `type` <[string]> Specify screenshot type, could be either `jpeg` or `png`. Defaults to 'png'.
    - `quality` <[number]> The quality of the image, between 0-100. Not applicable to `png` images.
    - `fullPage` <[boolean]> When true, takes a screenshot of the full scrollable page. Defaults to `false`.
    - `clip` <[Object]> An object which specifies clipping region of the page. Should have the following fields:
        - `x` <[number]> x-coordinate of top-left corner of clip area
        - `y` <[number]> y-coordinate of top-left corner of clip area
        - `width` <[number]> width of clipping area
        - `height` <[number]> height of clipping area
    - `omitBackground` <[boolean]> Hides default white background and allows capturing screenshots with transparency. Defaults to `false`.
- returns: <[Promise]<[Buffer]>> Promise which resolves to buffer with captured screenshot

#### page.select(selector, ...values)
- `selector` <[string]> A [selector] to query page for
- `...values` <...[string]> Values of options to select. If the `<select>` has the `multiple` attribute, all values are considered, otherwise only the first one is taken into account.
- returns: <[Promise]>

Triggers a `change` and `input` event once all the provided options have been selected.
If there's no `<select>` element matching `selector`, the method throws an error.

```js
page.select('select#colors', 'blue'); // single selection
page.select('select#colors', 'red', 'green', 'blue'); // multiple selections
```

#### page.setContent(html)
- `html` <[string]> HTML markup to assign to the page.
- returns: <[Promise]>

#### page.setCookie(...cookies)
- `...cookies` <...[Object]>
  - `name` <[string]> **required**
  - `value` <[string]> **required**
  - `url` <[string]>
  - `domain` <[string]>
  - `path` <[string]>
  - `expires` <[number]> Unix time in seconds.
  - `httpOnly` <[boolean]>
  - `secure` <[boolean]>
  - `sameSite` <[string]> `"Strict"` or `"Lax"`.
- returns: <[Promise]>

#### page.setExtraHTTPHeaders(headers)
- `headers` <[Object]> An object containing additional http headers to be sent with every request. All header values must be strings.
- returns: <[Promise]>

The extra HTTP headers will be sent with every request the page initiates.

> **NOTE** page.setExtraHTTPHeaders does not guarantee the order of headers in the outgoing requests.

#### page.setJavaScriptEnabled(enabled)
- `enabled` <[boolean]> Whether or not to enable JavaScript on the page.
- returns: <[Promise]>

> **NOTE** changing this value won't affect scripts that have already been run. It will take full effect on the next [navigation](#pagegotourl-options).

#### page.setRequestInterceptionEnabled(value)
- `value` <[boolean]> Whether to enable request interception.
- returns: <[Promise]>

Activating request interception enables `request.abort` and `request.continue`.

An example of a naïve request interceptor which aborts all image requests:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.setRequestInterceptionEnabled(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url.endsWith('.png') || interceptedRequest.url.endsWith('.jpg'))
      interceptedRequest.abort();
    else
      interceptedRequest.continue();
  });
  await page.goto('https://example.com');
  await browser.close();
});
```

#### page.setUserAgent(userAgent)
- `userAgent` <[string]> Specific user agent to use in this page
- returns: <[Promise]> Promise which resolves when the user agent is set.

#### page.setViewport(viewport)
- `viewport` <[Object]>
  - `width` <[number]> page width in pixels.
  - `height` <[number]> page height in pixels.
  - `deviceScaleFactor` <[number]> Specify device scale factor (could be thought of as dpr). Defaults to `1`.
  - `isMobile` <[boolean]> Whether the `meta viewport` tag is taken into account. Defaults to `false`.
  - `hasTouch`<[boolean]> Specifies if viewport supports touch events. Defaults to `false`
  - `isLandscape` <[boolean]> Specifies if viewport is in landscape mode. Defaults to `false`.
- returns: <[Promise]>

> **NOTE** in certain cases, setting viewport will reload the page in order to set the `isMobile` or `hasTouch` properties.

In the case of multiple pages in a single browser, each page can have its own viewport size.

#### page.tap(selector)
- `selector` <[string]> A [selector] to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped.
- returns: <[Promise]>

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [page.touchscreen](#pagetouchscreen) to tap in the center of the element.
If there's no element matching `selector`, the method throws an error.

#### page.title()
- returns: <[Promise]<[string]>> Returns page's title.

Shortcut for [page.mainFrame().title()](#frametitle).

#### page.touchscreen
- returns: <[Touchscreen]>

#### page.tracing
- returns: <[Tracing]>

#### page.type(text, options)
- `text` <[string]> A text to type into a focused element.
- `options` <[Object]>
  - `delay` <[number]> Time to wait between key presses in milliseconds. Defaults to 0.
- returns: <[Promise]>

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
- returns: <[Object]>
  - `width` <[number]> page width in pixels.
  - `height` <[number]> page height in pixels.
  - `deviceScaleFactor` <[number]> Specify device scale factor (could be though of as dpr). Defaults to `1`.
  - `isMobile` <[boolean]> Whether the `meta viewport` tag is taken into account. Defaults to `false`.
  - `hasTouch`<[boolean]> Specifies if viewport supports touch events. Defaults to `false`
  - `isLandscape` <[boolean]> Specifies if viewport is in landscape mode. Defaults to `false`.

#### page.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
- `selectorOrFunctionOrTimeout` <[string]|[number]|[function]> A [selector], predicate or timeout to wait for
- `options` <[Object]> Optional waiting parameters
- `...args` <...[Serializable]> Arguments to pass to  `pageFunction`
- returns: <[Promise]>

This method behaves differently with respect to the type of the first parameter:
- if `selectorOrFunctionOrTimeout` is a `string`, than the first argument is treated as a [selector] to wait for and the method is a shortcut for [page.waitForSelector](#pagewaitforselectorselector-options)
- if `selectorOrFunctionOrTimeout` is a `function`, than the first argument is treated as a predicate to wait for and the method is a shortcut for [page.waitForFunction()](#pagewaitforfunctionpagefunction-options-args).
- if `selectorOrFunctionOrTimeout` is a `number`, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
- otherwise, an exception is thrown

Shortcut for [page.mainFrame().waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])](#framewaitforselectororfunctionortimeout-options-args).

#### page.waitForFunction(pageFunction[, options[, ...args]])
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `options` <[Object]> Optional waiting parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it could be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- `...args` <...[Serializable]> Arguments to pass to  `pageFunction`
- returns: <[Promise]> Promise which resolves when the `pageFunction` returns a truthy value.

The `waitForFunction` could be used to observe viewport size change:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  const watchDog = page.waitForFunction('window.innerWidth < 100');
  page.setViewport({width: 50, height: 50});
  await watchDog;
  await browser.close();
});
```
Shortcut for [page.mainFrame().waitForFunction(pageFunction[, options[, ...args]])](#framewaitforfunctionpagefunction-options-args).

#### page.waitForNavigation(options)
- `options` <[Object]> Navigation parameters which might have the following properties:
  - `timeout` <[number]> Maximum navigation time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout.
  - `waitUntil` <[string]> When to consider navigation succeeded, defaults to `load`. Could be either:
    - `load` - consider navigation to be finished when the `load` event is fired.
    - `networkidle` - consider navigation to be finished when the network activity stays "idle" for at least `networkIdleTimeout` ms.
  - `networkIdleInflight` <[number]> Maximum amount of inflight requests which are considered "idle". Takes effect only with `waitUntil: 'networkidle'` parameter.
  - `networkIdleTimeout` <[number]> A timeout to wait before completing navigation. Takes effect only with `waitUntil: 'networkidle'` parameter.
- returns: <[Promise]<[Response]>> Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

#### page.waitForSelector(selector[, options])
- `selector` <[string]> A [selector] of an element to wait for,
- `options` <[Object]> Optional waiting parameters
  - `visible` <[boolean]> wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately. If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  let currentURL;
  page
    .waitForSelector('img')
    .then(() => console.log('First URL with image: ' + currentURL));
  for (currentURL of ['https://example.com', 'https://google.com', 'https://bbc.com'])
    await page.goto(currentURL);
  await browser.close();
});
```
Shortcut for [page.mainFrame().waitForSelector(selector[, options])](#framewaitforselectorselector-options).

### class: Keyboard

Keyboard provides an api for managing a virtual keyboard. The high level api is [`page.type`](#pagetypetext-options), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

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
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
- returns: <[Promise]>

Shortcut for [`mouse.move`](#mousemovex-y-options), [`mouse.down`](#mousedownoptions) and [`mouse.up`](#mouseupoptions).

#### mouse.down([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
- returns: <[Promise]>

Dispatches a `mousedown` event.

#### mouse.move(x, y, [options])
- `x` <[number]>
- `y` <[number]>
- `options` <[Object]>
  - `steps` <[number]> defaults to 1. Sends intermediate `mousemove` events.
- returns: <[Promise]>

Dispatches a `mousemove` event.

#### mouse.up([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
- returns: <[Promise]>

Dispatches a `mouseup` event.

### class: Touchscreen

#### touchscreen.tap(x, y)
- `x` <[number]>
- `y` <[number]>
- returns: <[Promise]>

Dispatches a `touchstart` and `touchend` event.

### class: Tracing

You can use [`tracing.start`](#tracingstartoptions) and [`tracing.stop`](#tracingstop) to create a trace file which can be opened in Chrome DevTools or [timeline viewer](https://chromedevtools.github.io/timeline-viewer/).

```js
await page.tracing.start({path: 'trace.json'});
await page.goto('https://www.google.com');
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
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.dismiss();
    await browser.close();
  });
  page.evaluate(() => alert('1'));
});
```

#### dialog.accept([promptText])
- `promptText` <[string]> A text to enter in prompt. Does not cause any effects if the dialog's `type` is not prompt.
- returns: <[Promise]> Promise which resolves when the dialog has been accepted.

#### dialog.defaultValue()
- returns: <[string]> If dialog is prompt, returns default prompt value. Otherwise, returns empty string.

#### dialog.dismiss()
- returns: <[Promise]> Promise which resolves when the dialog has been dismissed.

#### dialog.message()
- returns: <[string]> A message displayed in the dialog.

#### dialog.type
- <[string]>

Dialog's type, could be one of the `alert`, `beforeunload`, `confirm` and `prompt`.

### class: ConsoleMessage

[ConsoleMessage] objects are dispatched by page via the ['console'](#event-console) event.

#### consoleMessage.args
- <[Array]<[string]>>

#### consoleMessage.text
- <[string]>

#### consoleMessage.type
- <[string]>

One of the following values: `'log'`, `'debug'`, `'info'`, `'error'`, `'warning'`, `'dir'`, `'dirxml'`, `'table'`, `'trace'`, `'clear'`, `'startGroup'`, `'startGroupCollapsed'`, `'endGroup'`, `'assert'`, `'profile'`, `'profileEnd'`, `'count'`, `'timeEnd'`.

### class: Frame

At every point of time, page exposes its current frame tree via the [page.mainFrame()](#pagemainframe) and [frame.childFrames()](#framechildframes) methods.

[Frame] object's lifecycle is controlled by three events, dispatched on the page object:
- ['frameattached'](#event-frameattached) - fired when the frame gets attached to the page. Frame could be attached to the page only once.
- ['framenavigated'](#event-framenavigated) - fired when the frame commits navigation to a different URL.
- ['framedetached'](#event-framedetached) - fired when the frame gets detached from the page.  Frame could be detached from the page only once.

An example of dumping frame tree:

```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://www.google.com/chrome/browser/canary.html');
  dumpFrameTree(page.mainFrame(), '');
  await browser.close();

  function dumpFrameTree(frame, indent) {
    console.log(indent + frame.url());
    for (let child of frame.childFrames())
      dumpFrameTree(child, indent + '  ');
  }
});
```

#### frame.$(selector)
- `selector` <[string]> Selector to query page for
- returns: <[Promise]<[ElementHandle]>> Promise which resolves to ElementHandle pointing to the frame element.

The method queries frame for the selector. If there's no such element within the frame, the method will resolve to `null`.

#### frame.$$(selector)
- `selector` <[string]> Selector to query page for
- returns: <[Promise]<[Array]<[ElementHandle]>>> Promise which resolves to ElementHandles pointing to the frame elements.

The method runs `document.querySelectorAll` within the frame. If no elements match the selector, the return value resolve to `[]`.

#### frame.$eval(selector, pageFunction[, ...args])
- `selector` <[string]> A [selector] to query frame for
- `pageFunction` <[function]> Function to be evaluated in browser context
- `...args` <...[Serializable]|[ElementHandle]> Arguments to pass to `pageFunction`
- returns: <[Promise]<[Serializable]>> Promise which resolves to the return value of `pageFunction`

This method runs `document.querySelector` within the frame and passes it as the first argument to `pageFunction`. If there's no element matching `selector`, the method throws an error.

If `pageFunction` returns a [Promise], then `frame.$eval` would wait for the promise to resolve and return it's value.

Examples:
```js
const searchValue = await frame.$eval('#search', el => el.value);
const preloadHref = await frame.$eval('link[rel=preload]', el => el.href);
const html = await frame.$eval('.main-container', e => e.outerHTML);
```

#### frame.addScriptTag(url)
- `url` <[string]> Url of a script to be added
- returns: <[Promise]> Promise which resolves as the script gets added and loads.

Adds a `<script>` tag to the frame with the desired url. Alternatively, JavaScript could be injected to the frame via [`frame.injectFile`](#frameinjectfilefilepath) method.

#### frame.addStyleTag(url)
- `url` <[string]> Url of a stylesheet to be added
- returns: <[Promise]> Promise which resolves when the script gets added and loads.

Adds a `<link rel="stylesheet">` tag to the frame with the desired url.

#### frame.childFrames()
- returns: <[Array]<[Frame]>>

#### frame.evaluate(pageFunction, ...args)
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `...args` <...[Serializable]|[ElementHandle]> Arguments to pass to  `pageFunction`
- returns: <[Promise]<[Serializable]>> Promise which resolves to function return value

If the function, passed to the `frame.evaluate`, returns a [Promise], then `frame.evaluate` would wait for the promise to resolve and return it's value.

```js
const result = await frame.evaluate(() => {
  return Promise.resolve(8 * 7);
});
console.log(result); // prints "56"
```

A string can also be passed in instead of a function.

```js
console.log(await frame.evaluate('1 + 2')); // prints "3"
```

[ElementHandle] instances could be passed as arguments to the `frame.evaluate`:
```js
const bodyHandle = await frame.$('body');
const html = await frame.evaluate(body => body.innerHTML, bodyHandle);
await bodyHandle.dispose();
```

#### frame.injectFile(filePath)
- `filePath` <[string]> Path to the JavaScript file to be injected into frame. If `filePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
- returns: <[Promise]> Promise which resolves when file gets successfully evaluated in frame.

#### frame.isDetached()
- returns: <[boolean]>

Returns `true` if the frame has been detached, or `false` otherwise.

#### frame.name()
- returns: <[string]>

Returns frame's name attribute as specified in the tag.

If the name is empty, returns the id attribute instead.

> **NOTE** This value is calculated once when the frame is created, and will not update if the attribute is changed later.

#### frame.parentFrame()
- returns: <[Frame]> Returns parent frame, if any. Detached frames and main frames return `null`.

#### frame.title()
- returns: <[Promise]<[string]>> Returns page's title.

#### frame.url()
- returns: <[string]>

Returns frame's url.

#### frame.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
- `selectorOrFunctionOrTimeout` <[string]|[number]|[function]> A [selector], predicate or timeout to wait for
- `options` <[Object]> Optional waiting parameters
- `...args` <...[Serializable]> Arguments to pass to  `pageFunction`
- returns: <[Promise]>

This method behaves differently with respect to the type of the first parameter:
- if `selectorOrFunctionOrTimeout` is a `string`, than the first argument is treated as a [selector] to wait for and the method is a shortcut for [frame.waitForSelector](#framewaitforselectorselector-options)
- if `selectorOrFunctionOrTimeout` is a `function`, than the first argument is treated as a predicate to wait for and the method is a shortcut for [frame.waitForFunction()](#framewaitforfunctionpagefunction-options-args).
- if `selectorOrFunctionOrTimeout` is a `number`, than the first argument is treated as a timeout in milliseconds and the method returns a promise which resolves after the timeout
- otherwise, an exception is thrown


#### frame.waitForFunction(pageFunction[, options[, ...args]])
- `pageFunction` <[function]|[string]> Function to be evaluated in browser context
- `options` <[Object]> Optional waiting parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it could be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- `...args` <...[Serializable]> Arguments to pass to  `pageFunction`
- returns: <[Promise]> Promise which resolves when the `pageFunction` returns a truthy value.

The `waitForFunction` could be used to observe viewport size change:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  const watchDog = page.mainFrame().waitForFunction('window.innerWidth < 100');
  page.setViewport({width: 50, height: 50});
  await watchDog;
  await browser.close();
});
```

#### frame.waitForSelector(selector[, options])
- `selector` <[string]> A [selector] of an element to wait for,
- `options` <[Object]> Optional waiting parameters
  - `visible` <[boolean]> wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
- returns: <[Promise]> Promise which resolves when element specified by selector string is added to DOM.

Wait for the `selector` to appear in page. If at the moment of calling
the method the `selector` already exists, the method will return
immediately. If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations:
```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  let currentURL;
  page.mainFrame()
    .waitForSelector('img')
    .then(() => console.log('First URL with image: ' + currentURL));
  for (currentURL of ['https://example.com', 'https://google.com', 'https://bbc.com'])
    await page.goto(currentURL);
  await browser.close();
});
```

### class: ElementHandle

ElementHandle represents an in-page DOM element. ElementHandles could be created with the [page.$](#pageselector) method.

```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://google.com');
  const inputElement = await page.$('input[type=submit]');
  await inputElement.click();
  // ...
});
```

ElementHandle prevents DOM element from garbage collection unless the handle is [disposed](#elementhandledispose). ElementHandles are auto-disposed when their origin frame gets navigated.

ElementHandle instances can be used as arguments in [`page.$eval()`](#pageevalselector-pagefunction-args) and [`page.evaluate()`](#pageevaluatepagefunction-args) methods.

#### elementHandle.click([options])
- `options` <[Object]>
  - `button` <[string]> `left`, `right`, or `middle`, defaults to `left`.
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
- returns: <[Promise]> Promise which resolves when the element is successfully clicked. Promise gets rejected if the element is detached from DOM.

This method scrolls element into view if needed, and then uses [page.mouse](#pagemouse) to click in the center of the element.
If the element is detached from DOM, the method throws an error.

#### elementHandle.dispose()
- returns: <[Promise]> Promise which resolves when the element handle is successfully disposed.

The `elementHandle.dispose` method stops referencing the element handle.

#### elementHandle.hover()
- returns: <[Promise]> Promise which resolves when the element is successfully hovered.

This method scrolls element into view if needed, and then uses [page.mouse](#pagemouse) to hover over the center of the element.
If the element is detached from DOM, the method throws an error.

#### elementHandle.tap()
- returns: <[Promise]> Promise which resolves when the element is successfully tapped. Promise gets rejected if the element is detached from DOM.

This method scrolls element into view if needed, and then uses [touchscreen.tap](#touchscreentapx-y) to tap in the center of the element.
If the element is detached from DOM, the method throws an error.

#### elementHandle.uploadFile(...filePaths)
- `...filePaths` <...[string]> Sets the value of the file input these paths. If some of the  `filePaths` are relative paths, then they are resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
- returns: <[Promise]>

This method expects `elementHandle` to point to an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).

### class: Request

Whenever the page sends a request, the following events are emitted by puppeteer's page:
- ['request'](#event-request) emitted when the request is issued by the page.
- ['response'](#event-response) emitted when/if the response is received for the request.
- ['requestfinished'](#event-requestfinished) emitted when the response body is downloaded and the request is complete.

If request fails at some point, then instead of 'requestfinished' event (and possibly instead of 'response' event), the  ['requestfailed'](#event-requestfailed) event is emitted.

If request gets a 'redirect' response, the request is successfully finished with the 'requestfinished' event, and a new request is  issued to a redirected url.

#### request.abort()
- returns: <[Promise]>

Aborts request. To use this, request interception should be enabled with `page.setRequestInterceptionEnabled`.
Exception is immediately thrown if the request interception is not enabled.

#### request.continue([overrides])
- `overrides` <[Object]> Optional request overwrites, which could be one of the following:
  - `url` <[string]> If set, the request url will be changed
  - `method` <[string]> If set changes the request method (e.g. `GET` or `POST`)
  - `postData` <[string]> If set changes the post data of request
  - `headers` <[Object]> If set changes the request HTTP headers
- returns: <[Promise]>

Continues request with optional request overrides. To use this, request interception should be enabled with `page.setRequestInterceptionEnabled`.
Exception is immediately thrown if the request interception is not enabled.

#### request.headers
- <[Object]> An object with HTTP headers associated with the request. All header names are lower-case.

#### request.method
- <[string]>

Contains the request's method (GET, POST, etc.)

#### request.postData
- <[string]>

Contains the request's post body, if any.

#### request.resourceType
- <[string]>

Contains the request's resource type as it was perceived by the rendering engine.
ResourceType will be one of the following: `Document`, `Stylesheet`, `Image`, `Media`, `Font`, `Script`, `TextTrack`, `XHR`, `Fetch`, `EventSource`, `WebSocket`, `Manifest`, `Other`.

#### request.response()
- returns: <[Response]> A matching [Response] object, or `null` if the response has not been received yet.

#### request.url
- <[string]>

Contains the URL of the request.

### class: Response

[Response] class represents responses which are received by page.

#### response.buffer()
- returns: <Promise<[Buffer]>> Promise which resolves to a buffer with response body.

#### response.headers
- <[Object]> An object with HTTP headers associated with the response. All header names are lower-case.

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

#### response.text()
- returns: <[Promise]<[string]>> Promise which resolves to a text representation of response body.

#### response.url
- <[string]>

Contains the URL of the response.

[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Page]: #class-page "Page"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable "stream.Readable"
[Error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
[Frame]: #class-frame "Frame"
[ConsoleMessage]: #class-consolemessage "ConsoleMessage"
[iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols "Iterator"
[Response]: #class-response  "Response"
[Request]: #class-request  "Request"
[Browser]: #class-browser  "Browser"
[Body]: #class-body  "Body"
[Element]: https://developer.mozilla.org/en-US/docs/Web/API/element "Element"
[Keyboard]: #class-keyboard "Keyboard"
[Dialog]: #class-dialog  "Dialog"
[Mouse]: #class-mouse "Mouse"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"
[Tracing]: #class-tracing "Tracing"
[ElementHandle]: #class-elementhandle "ElementHandle"
[UIEvent.detail]: https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail "UIEvent.detail"
[Serializable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable"
[Touchscreen]: #class-touchscreen "Touchscreen"
