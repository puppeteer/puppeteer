# Experimental WebDriver BiDi support

[WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is a new cross-browser
automation protocol currently under development, aiming to combine the best of both WebDriver “Classic” and CDP. WebDriver BiDi promises bi-directional communication, making it fast by default, and it comes packed with low-level control.

See also:

- [WebDriver BiDi - The future of cross-browser automation](https://developer.chrome.com/articles/webdriver-bidi/)
- [WebDriver BiDi: 2023 status update](https://developer.chrome.com/blog/webdriver-bidi-2023/)

## Automate with Chrome and Firefox

Puppeteer supports WebDriver BiDi automation with Chrome and Firefox.

Firefox integration is nearing feature parity with its previous CDP-based approach. Learn more in the [dedicated announcement](https://hacks.mozilla.org/2023/12/puppeteer-webdriver-bidi/).

## Measuring progress

To gauge the capabilities of WebDriver BiDi, we utilized the comprehensive [Puppeteer test suite](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/)

- For Firefox, there are currently under [60](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/firefox-delta.json) failing tests compared to the CDP implementation, while over [82](https://puppeteer.github.io/ispuppeteerwebdriverbidiready/firefox-delta.json) new tests successfully utilize WebDriver BiDi, demonstrating its growing potential.
- For Chrome, around 68% of tests pass with WebDriver BiDi, indicating room for improvement compared to the CDP-based approach.

## Get started

Below is an example of launching Firefox or Chrome with WebDriver BiDi:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  product: 'firefox', // or 'chrome'
  protocol: 'webDriverBiDi',
});
const page = await browser.newPage();
...
await browser.close();
```

This is an exciting step towards a more unified and efficient cross-browser automation experience. We encourage you to explore WebDriver BiDi with Puppeteer and join us in shaping the future of browser automation.

## Puppeteer features supported over WebDriver BiDi

- Browser and page automation

  - Browser.close
  - Frame.goto() (except `referer` and `referrerPolicy`)
  - Page.bringToFront
  - Page.goBack()
  - Page.goForward()
  - Page.goto (except `referer` and `referrerPolicy`)
  - Page.reload (except for `ignoreCache` parameter)
  - Page.setViewport (`width`, `height`, `deviceScaleFactor` only)
  - Puppeteer.launch

- [Script evaluation](https://pptr.dev/guides/evaluate-javascript):

  - JSHandle.evaluate
  - JSHandle.evaluateHandle
  - Page.evaluate
  - Page.exposeFunction

- [Selectors](https://pptr.dev/guides/query-selectors) and [locators](https://pptr.dev/guides/locators) except for ARIA:

  - Page.$ (ARIA selectors supported in Chrome)
  - Page.$$ (ARIA selectors supported in Chrome)
  - Page.$$eval (ARIA selectors supported in Chrome)
  - Page.$eval (ARIA selectors supported in Chrome)
  - Page.waitForSelector (ARIA selectors supported in Chrome)

- Input

  - ElementHandle.uploadFile
  - ElementHandle.click
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

  - Page.screenshot (supported parameters `clip`, `encoding`, `fullPage`)

- PDF generation (not all parameters are supported)

  - Page.pdf (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)
  - Page.createPDFStream (only `format`, `height`, `landscape`, `margin`, `pageRanges`, `printBackground`, `scale`, `width` are supported)

- Permissions (Supported in Chrome only)

  - BrowserContext.clearPermissionOverrides()
  - BrowserContext.overridePermissions()

## Puppeteer features not yet supported over WebDriver BiDi

- [Request interception](https://pptr.dev/guides/request-interception)

  - HTTPRequest.abort()
  - HTTPRequest.abortErrorReason()
  - HTTPRequest.client()
  - HTTPRequest.continue()
  - HTTPRequest.continueRequestOverrides()
  - HTTPRequest.failure()
  - HTTPRequest.finalizeInterceptions()
  - HTTPRequest.interceptResolutionState()
  - HTTPRequest.isInterceptResolutionHandled()
  - HTTPRequest.respond()
  - HTTPRequest.responseForRequest()
  - Page.setRequestInterception()

- Various emulations (most are supported with Chrome)

  - Page.emulate() (supported only in Chrome)
  - Page.emulateCPUThrottling() (supported only in Chrome)
  - Page.emulateIdleState() (supported only in Chrome)
  - Page.emulateMediaFeatures() (supported only in Chrome)
  - Page.emulateMediaType() (supported only in Chrome)
  - Page.emulateTimezone() (supported only in Chrome)
  - Page.emulateVisionDeficiency() (supported only in Chrome)
  - Page.setBypassCSP() (supported only in Chrome)
  - Page.setCacheEnabled() (supported only in Chrome)
  - Page.setGeolocation() (supported only in Chrome)
  - Page.setJavaScriptEnabled() (supported only in Chrome)

- CDP-specific features

  - Page.createCDPSession() (supported only in Chrome)

- Tracing (supported only in Chrome)
- Coverage (supported only in Chrome)
- Accessibility (supported only in Chrome)

- Other methods:

  - Browser.userAgent()
  - Frame.isOOPFrame()
  - Frame.waitForDevicePrompt()
  - HTTPResponse.buffer()
  - HTTPResponse.fromServiceWorker()
  - HTTPResponse.securityDetails()
  - Input.drag()
  - Input.dragAndDrop()
  - Input.dragOver()
  - Input.drop()
  - Page.authenticate()
  - Page.cookies()
  - Page.deleteCookie()
  - Page.emulateNetworkConditions()
  - Page.isDragInterceptionEnabled()
  - Page.isJavaScriptEnabled() (supported only in Chrome)
  - Page.isServiceWorkerBypassed()
  - Page.metrics()
  - Page.queryObjects() (supported only in Chrome)
  - Page.screencast() (supported only in Chrome)
  - Page.setBypassServiceWorker()
  - Page.setCookie()
  - Page.setDragInterception()
  - Page.setExtraHTTPHeaders()
  - Page.setOfflineMode()
  - Page.setUserAgent()
  - Page.waitForDevicePrompt()
  - Page.waitForFileChooser()
  - Page.workers()
  - PageEvent.popup
  - PageEvent.WorkerCreated
  - PageEvent.WorkerDestroyed
  - Target.opener()
