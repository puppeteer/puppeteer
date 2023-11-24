# Experimental WebDriver BiDi Support

[WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is a new cross-browser
automation protocol that adds browser-driven events to WebDriver. Here are the
resources if you want to learn more about WebDriver BiDi:

- [WebDriver BiDi - The future of cross-browser automation](https://developer.chrome.com/articles/webdriver-bidi/)
- [WebDriver BiDi: 2023 status update](https://developer.chrome.com/blog/webdriver-bidi-2023/)

## Automate with Chrome and Firefox

Firefox support has almost reaching feature parity with the previous CDP-based
implementation. To see which features are fully supported with WebDriver BiDi we
used the [Puppeteer test suite](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/). Currently,
we still have [60](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/firefox-delta.json) tests
that are failing with Firefox and WebDriver BiDi compared to the previous CDP
implementation in Firefox but we also have [82](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/firefox-delta.json)
new tests that work with WebDriver BiDi and that didn't work with CDP.

For Chrome, around 68% of the tests are currently passing with WebDriver BiDi so
the CDP-based implementation remains more powerful. Some of the Puppeteer
functionality is relying on CDP even with WebDriver BiDi enabled. Therefore, the
test pass rate is currently higher than that one of Firefox.

Example of launching Firefox with WebDriver BiDi:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  product: 'firefox',
  protocol: 'webDriverBiDi',
});
const page = await browser.newPage();
...
await browser.close();
```

Example of launching Chrome with WebDriver BiDi:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  product: 'chrome',
  protocol: 'webDriverBiDi',
});
const page = await browser.newPage();
...
await browser.close();
```

## Puppeteer features supported over WebDriver BiDi

- Browser and page automation

  - Puppeteer.launch
  - Browser.close
  - Page.bringToFront
  - Page.goto
  - Page.reload (except for `ignoreCache` parameter)
  - Page.setViewport (`width`, `height`, `deviceScaleFactor` only)

- [Script evaluation](https://pptr.dev/guides/evaluate-javascript):

  - Page.evaluate
  - Page.exposeFunction
  - JSHandle.evaluate
  - JSHandle.evaluateHandle

- [Selectors](https://pptr.dev/guides/query-selectors) and [locators](https://pptr.dev/guides/locators) except for ARIA:

  - Page.$ (ARIA selectors only supported in Chrome)
  - Page.$$ (ARIA selectors only supported in Chrome)
  - Page.$eval (ARIA selectors only supported in Chrome)
  - Page.$$eval (ARIA selectors only supported in Chrome)
  - Frame.goto() (except `referer` and `referrerPolicy`)
  - Page.waitForSelector (ARIA selectors only supported in Chrome)

- Input

  - ElementHandle.click
  - Keyboard.down
  - Keyboard.press
  - Keyboard.sendCharacter
  - Keyboard.type
  - Keyboard.up
  - Mouse events (except for dedicated drag'n'drop API methods)
  - TouchScreen.\*
  - Page.tap

- JavaScript dialog interception

  - page.on('dialog')
  - Dialog.\*

- Screenshots (not all parameters are supported)

  - Page.screenshot (supported parameters `clip`, `encoding`, `fullPage`)

- PDF generation (not all parameters are supported)

  - Page.pdf (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)
  - Page.createPDFStream (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)

## Puppeteer features not yet supported over WebDriver BiDi

- [Request interception](https://pptr.dev/guides/request-interception)

  - HTTPRequest.client()
  - HTTPRequest.continueRequestOverrides()
  - HTTPRequest.responseForRequest()
  - HTTPRequest.abortErrorReason()
  - HTTPRequest.interceptResolutionState()
  - HTTPRequest.isInterceptResolutionHandled()
  - HTTPRequest.finalizeInterceptions()
  - HTTPRequest.failure()
  - HTTPRequest.continue()
  - HTTPRequest.respond()
  - HTTPRequest.abort()
  - Page.setRequestInterception()

- Permissions

  - BrowserContext.overridePermissions()
  - BrowserContext.clearPermissionOverrides()

- Various emulations (most are only supported with Chrome)

  - Page.emulate() (supported only in Chrome)
  - Page.setJavaScriptEnabled() (supported only in Chrome)
  - Page.setBypassCSP() (supported only in Chrome)
  - Page.emulateMediaType() (supported only in Chrome)
  - Page.emulateCPUThrottling() (supported only in Chrome)
  - Page.emulateMediaFeatures() (supported only in Chrome)
  - Page.emulateTimezone() (supported only in Chrome)
  - Page.emulateIdleState() (supported only in Chrome)
  - Page.emulateVisionDeficiency() (supported only in Chrome)
  - Page.setCacheEnabled() (supported only in Chrome)
  - Page.setGeolocation() (supported only in Chrome)

- CDP-specific features

  - Page.createCDPSession() (supported only in Chrome)

- Tracing (supported only in Chrome)
- Coverage (supported only in Chrome)
- Accessibility (supported only in Chrome)

- Other methods:

  - Browser.userAgent()
  - ElementHandle.uploadFile()
  - Frame.isOOPFrame()
  - Frame.waitForDevicePrompt()
  - Target.opener()
  - HTTPResponse.securityDetails()
  - HTTPResponse.buffer()
  - HTTPResponse.fromServiceWorker()
  - Input.drag()
  - Input.dragOver()
  - Input.drop()
  - Input.dragAndDrop()
  - PageEvent.popup
  - PageEvent.WorkerCreated
  - PageEvent.WorkerDestroyed
  - Page.isServiceWorkerBypassed()
  - Page.isDragInterceptionEnabled()
  - Page.isJavaScriptEnabled() (supported only in Chrome)
  - Page.waitForFileChooser()
  - Page.workers()
  - Page.setBypassServiceWorker()
  - Page.setDragInterception()
  - Page.setOfflineMode()
  - Page.emulateNetworkConditions()
  - Page.queryObjects() (supported only in Chrome)
  - Page.cookies()
  - Page.deleteCookie()
  - Page.setCookie()
  - Page.authenticate()
  - Page.setExtraHTTPHeaders()
  - Page.setUserAgent()
  - Page.metrics()
  - Page.goBack()
  - Page.goForward()
  - Page.screencast() (supported only in Chrome)
  - Page.waitForDevicePrompt()
