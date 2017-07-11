# Puppeteer [![Build Status](https://travis-ci.com/GoogleChrome/puppeteer.svg?token=8jabovWqb8afz5RDcYqx&branch=master)](https://travis-ci.com/GoogleChrome/puppeteer)

Puppeteer is a Node library which provides a high-level API to control Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Puppeteer is inspired by [PhantomJS](http://phantomjs.org/). Check our [FAQ](#faq) to learn more.

## Use Cases
* Up-to-date testing environment that supports the latest Javascript features.
* Crawl your site to generate pre-rendered content for your SPA.
* Scrape content from websites.

## Installation

Get the source:

```
git clone https://github.com/GoogleChrome/puppeteer
cd puppeteer
```

Install the dependencies:

```
yarn
```

or use `npm`:

```
npm install
```

> Note: Puppeteer bundles Chromium (~70Mb) which it is guaranteed to work with. However, you're free to point Puppeteer to any Chromium executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))


## Getting Started

The following script navigates to https://example.com and saves a screenshot to *example.png*:

```javascript
const Browser = require('Puppeteer').Browser;
const browser = new Browser();

browser.newPage().then(async page => {
  await page.navigate('https://example.com');
  await page.screenshot({path: 'example.png'});
  browser.close();
});
```

A few notes:

1. By default, Puppeteer runs a bundled Chromium browser. However, you can point Puppeteer to a different executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))
2. Puppeteer creates its own Chromium user profile which it cleans up on every run.
3. Puppeteer sets an initial page size to 400px x 300px, which defines the screenshot size. The page size can be changed with `Page.setViewportSize()` method

## API

[API documentation](docs/api.md) is a work in progress.

## Contributing

Check out our [contributing guide](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

# FAQ

#### Q: What is Puppeteer?

Puppeteer is a light-weight Node module to control headless Chrome using the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

#### Q: Does Puppeteer work with headless Chromium?

Yes. Puppeteer bundles a version of Chromium and runs it in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome) by default.

#### Q: How is Puppeteer different than PhantomJS?

While PhantomJS provides a JavaScript API to control a full-fledged browser (WebKit), Puppeteer is a light-weight Node module to control headless Chrome.

Other important differences:

- Uses an evergreen browser - Puppeteer uses headless Chromium, which means it can access all the latest web platform features offered by the Blink rendering engine.
- Improved debuggability - thanks to Node debugging in Chrome DevTools.

#### Q: Which Chromium version does Puppeteer use?

[TODO]

#### Q: How do I migrate from PhantomJS to Puppeteer?

There's no automatic way to migrate PhantomJS scripts to Node scripts with Puppeteer. For more information and some guidance, check out our [migration guide](#migration-guide).

#### Q: Why do most of the API methods return promises?

Since Puppeteer's code is run by Node, it exists out-of-process to the controlled Chromium instance. This requires most of the API calls to be asynchronous to allow the necessary roundtrips to the browser.

However, if you're using Node 8 or higher, `async/await` make life easier:

```javascript
browser.newPage().then(async page => {
  await page.setViewport({width: 1000, height: 1000});
  await page.pdf({path: 'blank.pdf'});
  browser.close();
});
```

#### Q: What is the "Phantom Shim"?

"Phantom Shim" is a layer built atop the Puppeteer API that simulates Phantom's environment.

Puppeteer's process model is different than Phantom's. Puppeteer runs out-of-process to the browser, whereas  Phantom runs in-process. To simulate in-process behavior, phantom_shim hacks Node's runtime with [nested event loops](https://github.com/abbr/deasync)) to simulate in-process operation. This might result in unpredictable side-effects and makes the shim unreliable for certain use cases situations.

#### Q: What is the difference between Puppeteer and Selenium / WebDriver?

Selenium / WebDriver is a well-established cross-browser API that is useful for testing cross-browser support.

Puppeteer is useful for single-browser testing. For example, many teams only run unit tests with a single browser (e.g. Phantom). In non-testing use cases, Puppeteer provides a powerful but simple API because it's only targeting one browser that enables you to rapidly develop automation scripts.

# Migration Guide

[TODO]
