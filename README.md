# Puppeteer

Puppeteer is a node.js library which provides a high-level API to control chromium over the Devtools Protocol. Puppeteer is inspired by [PhantomJS](http://phantomjs.org/). Check our [FAQ](http://todo) to learn more.

## Installation

```
git clone https://github.com/GoogleChrome/puppeteer
cd puppeteer
npm install
```
> Note: Puppeteer bundles chromium (~70Mb) which it is guaranteed to work with. However, you're free to point puppeteer to any chromium executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))


## Getting Started

The following node.js script navigates page to the https://example.com and saves screenshot to *example.jpg*:

```javascript
var Browser = require('Puppeteer').Browser;
var browser = new Browser();

browser.newPage().then(async page => {
    await page.navigate('https://example.com');
    await page.screenshot({path: 'example.jpg'});
    browser.close();
});
```
A few gotchas:

1.  By default, puppeeteer runs bundled chromium browser. However, you can point puppeteer to a different executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))
2. Puppeteer creates its own chromium user profile which it cleans up on every run.
3. Puppeteer sets initial page size to 400px x 300px, which defines the screenshot size. The page size could be changed with `Page.setSize()` method

## Contributing

Check out our [contributing guide](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

# FAQ

#### Q: What is Puppeteer?

Puppeteer is a lightweight node.js module which provides high-level API atop of DevTools protocol to control chromium browsers.

#### Q: Does Puppeteer work with headless Chromium?

Yes. Puppeteer bundles chromium and runs it in a headless mode by default.

#### Q: How's Puppeteer different to PhantomJS?

PhantomJS is a scriptable full-fledged browser. Puppeteer is a light-weight NPM module which could be used from any node.js script. This difference provides Puppeteer scripts with the following advantages:

- Ever-green chromium browser
- Node.js runtime environment and npm ecosystem
- Debuggability (thanks to node.js debugging and non-headless chromium mode)

#### Q: Which Chromium version does Puppeteer use?

[TODO]

#### Q: How do I migrate from PhantomJS to Puppeteer?

There's no automatic way to migrate PhantomJS scripts to node.js scripts with Puppeteer. For more information and some guidance, check out our [migration guide](http://todo).

#### Q: Why do most of the API methods return promises?

Since Puppeteer's code is run by node.js, it exists out-of-process to the controlled chromium instance. This requires most of the API methods to be asynchronous to allow for the roundtrip to the browser.

However, with the new `async/await` syntax this should not deal much troubles:

```javascript
browser.newPage().then(async page => {
	await page.setViewportSize({width: 1000, height: 1000});
	await page.printToPDF('blank.pdf');
	browser.close();
});
```

#### Q: What's "Phantom Shim"?

"Phantom Shim" is a layer built atop of Puppeteer API. The layer simulates phantomJS environment, employing unhealthy approaches (e.g. in-process code execution is emulated via [nested event loops](https://github.com/abbr/deasync)). 

The shim is developed to run PhantomJS tests and estimate the comprehensiveness of Puppeteer API.

# Migration Guide
[TODO]
