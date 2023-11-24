# Experimental WebDriver BiDi Support

[WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is a new cross-browser
automation protocol that extends WebDriver with events. Here are the resources if you want to learn more about WebDriver BiDi:

- [WebDriver BiDi - The future of cross-browser automation](https://developer.chrome.com/articles/webdriver-bidi/)
- [WebDriver BiDi: 2023 status update](https://developer.chrome.com/blog/webdriver-bidi-2023/)


## Automate with Chrome and Firefox

supporting WebDriver BiDi whenever possible and currently has experimental
Puppeteer aims at support for automating Firefox and Chrome over WebDriver BiDi. Firefox
support almost reaching feature parity with the previous CDP-based
implementation.

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

- Frame.goto() (except `referer` and `referrerPolicy``)
- Page.$ (ARIA selectors only supported in Chrome)
- Page.$$ (ARIA selectors only supported in Chrome)
- Page.$eval (ARIA selectors only supported in Chrome)
- Page.$$eval (ARIA selectors only supported in Chrome)
- Page.setViewport (width, height, dpr only)
- Page.screenshot (not all attributes)
- Page.createPDFStream (partial support)
- Page.waitForSelector (ARIA selectors only supported in Chrome)

## Puppeteer features not yet supported over WebDriver BiDi

- Browser.userAgent()
- BrowserContext.overridePermissions()
- BrowserContext.clearPermissionOverrides()
- ElementHandle.uploadFile()
- Frame.isOOPFrame()
- Frame.waitForDevicePrompt()
- Tracing (supported only in Chrome)
- Coverage (supported only in Chrome)
- Accessibility (supported only in Chrome)
- Target.opener()
- HTTPResponse.securityDetails()
- HTTPResponse.buffer()
- HTTPResponse.fromServiceWorker()
- Input.drag()
- Input.dragOver()
- Input.drop()
- Input.dragAndDrop()
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
- PageEvent.popup
- PageEvent.WorkerCreated
- PageEvent.WorkerDestroyed
- Page.isServiceWorkerBypassed()
- Page.isDragInterceptionEnabled()
- Page.isJavaScriptEnabled() (supported only in Chrome)
- Page.waitForFileChooser()
- Page.setGeolocation() (supported only in Chrome)
- Page.createCDPSession() (supported only in Chrome)
- Page.workers()
- Page.setRequestInterception()
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
- Page.screencast() (supported only in Chrome)
- Page.tap()
- Page.waitForDevicePrompt()
