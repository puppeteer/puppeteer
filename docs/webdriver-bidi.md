# WebDriver BiDi support

[WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is a new
cross-browser automation protocol currently under development, aiming to
combine the best of both WebDriver “Classic” and CDP. WebDriver BiDi
promises bi-directional communication, making it fast by default, and it
comes packed with low-level control.

## Automate with Chrome and Firefox

Puppeteer supports WebDriver BiDi automation with Chrome and Firefox.
When launching Firefox with Puppeteer, the WebDriver BiDi Protocol is
enabled by default. When launching Chrome, CDP is still used by default
since not all CDP features are supported by WebDriver BiDi yet. If a
certain Puppeteer feature is not supported over WebDriver BiDi yet,
[`UnsupportedOperation`](https://pptr.dev/api/puppeteer.unsupportedoperation/)
error is thrown. Also see the lists below on what is supported with
WebDriver BiDi.

## Get started

Below is an example of launching Firefox or Chrome with WebDriver BiDi:

```ts
import puppeteer from 'puppeteer';

const firefoxBrowser = await puppeteer.launch({
  product: 'firefox', // WebDriver BiDi is used by default.
});
const page = await firefoxBrowser.newPage();
...
await firefoxBrowser.close();

const chromeBrowser = await puppeteer.launch({
  product: 'chrome',
  protocol: 'webDriverBiDi'
});
const page = await chromeBrowser.newPage();
...
await chromeBrowser.close();
```

## Puppeteer features not yet supported over WebDriver BiDi

- Various emulations (most are supported with Chrome)

  - Page.emulate() (supported only in Chrome)
  - Page.emulateCPUThrottling() (supported only in Chrome)
  - Page.emulateIdleState() (supported only in Chrome)
  - Page.emulateMediaFeatures() (supported only in Chrome)
  - Page.emulateMediaType() (supported only in Chrome)
  - Page.emulateTimezone() (supported only in Chrome)
  - Page.emulateVisionDeficiency() (supported only in Chrome)
  - Page.setBypassCSP() (supported only in Chrome)
  - Page.setGeolocation() (supported only in Chrome)
  - Page.setJavaScriptEnabled() (supported only in Chrome)

- CDP-specific features

  - HTTPRequest.client() (supported only in Chrome)
  - Page.createCDPSession() (supported only in Chrome)

- Accessibility (supported only in Chrome)
- Coverage (supported only in Chrome)
- Tracing (supported only in Chrome)

- Other methods:

  - Frame.isOOPFrame()
  - Frame.waitForDevicePrompt()
  - HTTPResponse.buffer()
  - HTTPResponse.fromServiceWorker()
  - HTTPResponse.securityDetails()
  - Input.drag()
  - Input.dragAndDrop()
  - Input.dragOver()
  - Input.drop()
  - Page.emulateNetworkConditions()
  - Page.isDragInterceptionEnabled()
  - Page.isJavaScriptEnabled() (supported only in Chrome)
  - Page.isServiceWorkerBypassed()
  - Page.metrics()
  - Page.queryObjects() (supported only in Chrome)
  - Page.screencast() (supported only in Chrome)
  - Page.setBypassServiceWorker()
  - Page.setDragInterception()
  - Page.setOfflineMode()
  - Page.waitForDevicePrompt()
  - Page.waitForFileChooser()
  - PageEvent.popup

## Puppeteer features fully supported over WebDriver BiDi

- Browser automation

  - Browser.close()
  - Browser.userAgent()
  - Browser.version()
  - Puppeteer.launch()

- Page automation

  - Page.bringToFront
  - Page.goBack()
  - Page.goForward()
  - Page.goto (except `referer` and `referrerPolicy`)
  - Frame.goto() (except `referer` and `referrerPolicy`)
  - Page.reload (except for `ignoreCache` parameter)
  - Page.setViewport (`width`, `height`, `deviceScaleFactor` only)
  - Page.cookies()
  - Page.setCookie()
  - Page.deleteCookie()
  - Page.workers()
  - PageEvent.WorkerCreated
  - PageEvent.WorkerDestroyed
  - Page.setExtraHTTPHeaders()
  - Target.opener()
  - Page 'popup' event
  - Page.setCacheEnabled()

- [Script evaluation](https://pptr.dev/guides/evaluate-javascript):

  - JSHandle.evaluate
  - JSHandle.evaluateHandle
  - Page.evaluate
  - Page.exposeFunction

- [Selectors](https://pptr.dev/guides/query-selectors) and [locators](https://pptr.dev/guides/locators) except for ARIA:

  - Page.$
  - Page.$$
  - Page.$$eval
  - Page.$eval
  - Page.waitForSelector
  - Page.locator.\*

- Input

  - ElementHandle.click
  - ElementHandle.uploadFile
  - Keyboard.down
  - Keyboard.press
  - Keyboard.sendCharacter
  - Keyboard.type
  - Keyboard.up
  - Mouse events (except for dedicated drag'n'drop API methods)
  - Page.tap
  - TouchScreen.\*

- JavaScript dialog interception

  - page.on('dialog')
  - Dialog.\*

- Screenshots (not all parameters are supported)

  - Page.screenshot (supported parameters are `clip`, `encoding`, `fullPage`)

- PDF generation (not all parameters are supported)

  - Page.pdf (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)
  - Page.createPDFStream (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)

- Permissions

  - BrowserContext.clearPermissionOverrides()
  - BrowserContext.overridePermissions()

- [Request interception](https://pptr.dev/guides/request-interception)
  - HTTPRequest.abort() (no custom error support)
  - HTTPRequest.abortErrorReason()
  - HTTPRequest.continue()
  - HTTPRequest.continueRequestOverrides()
  - HTTPRequest.failure()
  - HTTPRequest.finalizeInterceptions()
  - HTTPRequest.interceptResolutionState()
  - HTTPRequest.isInterceptResolutionHandled()
  - HTTPRequest.respond()
  - HTTPRequest.responseForRequest()
  - Page.authenticate()
  - Page.setRequestInterception()
  - Page.setUserAgent()

## See also

- [WebDriver BiDi - The future of cross-browser automation](https://developer.chrome.com/articles/webdriver-bidi/)
- [WebDriver BiDi: 2023 status update](https://developer.chrome.com/blog/webdriver-bidi-2023/)
- [Puppeteer Support for the Cross-Browser WebDriver BiDi Standard](https://hacks.mozilla.org/2023/12/puppeteer-webdriver-bidi/)
