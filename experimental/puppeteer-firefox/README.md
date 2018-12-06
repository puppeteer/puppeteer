<img src="https://user-images.githubusercontent.com/39191/49555713-a07b3c00-f8b5-11e8-8aba-f2d03cd83da5.png" height="200" align="right">

# Puppeteer for Firefox

> Use Puppeteer's API with Firefox

> **BEWARE**: This project is experimental. 🐊 live here.

## Getting Started

### Installation

To use Puppeteer with Firefox in your project, run:

```bash
npm i puppeteer-firefox
# or "yarn add puppeteer-firefox"
```

Note: When you install puppeteer-firefox, it downloads a [custom-built Firefox](https://github.com/GoogleChrome/puppeteer/tree/master/experimental/juggler) (Firefox/63.0.4) that is guaranteed to work with the API.

### Usage

**Example** - navigating to https://example.com and saving a screenshot as *example.png*:

Save file as **example.js**

```js
const pptrFirefox = require('puppeteer-firefox');

(async () => {
  const browser = await pptrFirefox.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
```

Execute script on the command line

```bash
node example.js
```


### API Status

Big lacking parts:

- `page.emulate`
- `page.pdf`
- all network-related APIs: `page.on('request')`, `page.on('response')`, and request interception

Supported API:

- class: Puppeteer
  * puppeteer.executablePath()
  * puppeteer.launch([options])
- class: Browser
  * event: 'targetchanged'
  * event: 'targetcreated'
  * event: 'targetdestroyed'
  * browser.close()
  * browser.newPage()
  * browser.pages()
  * browser.process()
  * browser.targets()
  * browser.userAgent()
  * browser.version()
  * browser.waitForTarget(predicate[, options])
- class: Target
  * target.browser()
  * target.page()
  * target.type()
  * target.url()
- class: Page
  * event: 'close'
  * event: 'console'
  * event: 'dialog'
  * event: 'domcontentloaded'
  * event: 'frameattached'
  * event: 'framedetached'
  * event: 'framenavigated'
  * event: 'load'
  * event: 'pageerror'
  * page.$(selector)
  * page.$$(selector)
  * page.$$eval(selector, pageFunction[, ...args])
  * page.$eval(selector, pageFunction[, ...args])
  * page.$x(expression)
  * page.addScriptTag(options)
  * page.addStyleTag(options)
  * page.browser()
  * page.click(selector[, options])
  * page.close(options)
  * page.content()
  * page.evaluate(pageFunction, ...args)
  * page.evaluateOnNewDocument(pageFunction, ...args)
  * page.focus(selector)
  * page.frames()
  * page.goBack(options)
  * page.goForward(options)
  * page.goto(url, options)
  * page.hover(selector)
  * page.isClosed()
  * page.keyboard
  * page.mainFrame()
  * page.mouse
  * page.reload(options)
  * page.screenshot([options])
  * page.select(selector, ...values)
  * page.setContent(html)
  * page.setViewport(viewport)
  * page.target()
  * page.title()
  * page.type(selector, text[, options])
  * page.url()
  * page.viewport()
  * page.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
  * page.waitForFunction(pageFunction[, options[, ...args]])
  * page.waitForNavigation(options)
  * page.waitForSelector(selector[, options])
  * page.waitForXPath(xpath[, options])
- class: Frame
  * frame.$(selector)
  * frame.$$(selector)
  * frame.$$eval(selector, pageFunction[, ...args])
  * frame.$eval(selector, pageFunction[, ...args])
  * frame.$x(expression)
  * frame.addScriptTag(options)
  * frame.addStyleTag(options)
  * frame.childFrames()
  * frame.click(selector[, options])
  * frame.content()
  * frame.evaluate(pageFunction, ...args)
  * frame.focus(selector)
  * frame.hover(selector)
  * frame.isDetached()
  * frame.name()
  * frame.parentFrame()
  * frame.select(selector, ...values)
  * frame.setContent(html)
  * frame.title()
  * frame.type(selector, text[, options])
  * frame.url()
  * frame.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
  * frame.waitForFunction(pageFunction[, options[, ...args]])
  * frame.waitForSelector(selector[, options])
  * frame.waitForXPath(xpath[, options])
- class: JSHandle
  * jsHandle.asElement()
  * jsHandle.dispose()
  * jsHandle.getProperties()
  * jsHandle.getProperty(propertyName)
  * jsHandle.jsonValue()
  * jsHandle.toString()
- class: ElementHandle
  * elementHandle.$(selector)
  * elementHandle.$$(selector)
  * elementHandle.$$eval(selector, pageFunction, ...args)
  * elementHandle.$eval(selector, pageFunction, ...args)
  * elementHandle.$x(expression)
  * elementHandle.boundingBox()
  * elementHandle.click([options])
  * elementHandle.dispose()
  * elementHandle.focus()
  * elementHandle.hover()
  * elementHandle.isIntersectingViewport()
  * elementHandle.press(key[, options])
  * elementHandle.screenshot([options])
  * elementHandle.type(text[, options])
- class: Keyboard
  * keyboard.down(key[, options])
  * keyboard.press(key[, options])
  * keyboard.sendCharacter(char)
  * keyboard.type(text, options)
  * keyboard.up(key)
- class: Mouse
  * mouse.click(x, y, [options])
  * mouse.down([options])
  * mouse.move(x, y, [options])
  * mouse.up([options])
- class: Dialog
  * dialog.accept([promptText])
  * dialog.defaultValue()
  * dialog.dismiss()
  * dialog.message()
  * dialog.type()
- class: ConsoleMessage
  * consoleMessage.args()
  * consoleMessage.text()
  * consoleMessage.type()
- class: TimeoutError


Special thanks to [Amine Bouhlali](https://bitbucket.org/aminerop/) who volunteered the [`puppeteer-firefox`](https://www.npmjs.com/package/puppeteer-firefox) NPM package.
