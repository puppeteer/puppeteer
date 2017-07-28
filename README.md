# Puppeteer [![Build Status](https://travis-ci.com/GoogleChrome/puppeteer.svg?token=8jabovWqb8afz5RDcYqx&branch=master)](https://travis-ci.com/GoogleChrome/puppeteer) 
###### [API](docs/api.md) | [FAQ](#faq) | [Contributing](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

Puppeteer is a node library which provides a high-level API to control Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).


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

```sh
yarn # or 'npm install'
```
> **NOTE** Puppeteer bundles Chromium (~90Mb) which it is guaranteed to work with. However, you're free to point Puppeteer to any Chromium executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))


## Getting Started

To navigate to https://example.com and save a screenshot as *example.png*, save the following script as `example.js` and run it using `node example.js`:

```js
const Browser = require('puppeteer').Browser;
const browser = new Browser();

browser.newPage().then(async page => {
  await page.navigate('https://example.com');
  await page.screenshot({path: 'example.png'});
  browser.close();
});
```

A few notes:

1. By default, Puppeteer bundles chromium browser with which it works best. However, you can point Puppeteer to a different executable ([example](https://github.com/GoogleChrome/puppeteer/blob/master/examples/custom-chromium-revision.js))
2. Puppeteer creates its own Chromium user profile which it cleans up on every run.
3. Puppeteer sets an initial page size to 400px x 300px, which defines the screenshot size. The page size can be changed with `Page.setViewportSize()` method
4. By default, browser is launched in a headless mode. This could be changed via ['headless' browser option](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#new-browseroptions)

## API Documentation

Explore the [API documentation](docs/api.md) and [examples](https://github.com/GoogleChrome/puppeteer/tree/master/examples/) to learn more.

## Contributing to Puppeteer

Check out [contributing guide](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md) to get an overview of puppeteer development. 

# FAQ

#### Q: What is Puppeteer?

Puppeteer is a light-weight Node module to control headless Chrome using the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

#### Q: Which Chromium version does Puppeteer use?

Puppeteer bundles chromium it works best with. As chromium improves over time,   new versions of puppeteer will be released which depend on a newer chromium versions.

Current chromium version is declared in [package.json](https://github.com/GoogleChrome/puppeteer/blob/master/package.json) as `chromium_revision` field.

#### Q: Does Puppeteer work with headless Chromium?

Yes. Puppeteer runs chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome) by default.

#### Q: Why do most of the API methods return promises?

Since Puppeteer's code is run by Node, it exists out-of-process to the controlled Chromium instance. This requires most of the API calls to be asynchronous to allow the necessary roundtrips to the browser.

It is recommended to use `async/await` to consume asynchronous api:
```js
browser.newPage().then(async page => {
  await page.setViewport({width: 1000, height: 1000});
  await page.pdf({path: 'blank.pdf'});
  browser.close();
});
```

#### Q: What is the "Phantom Shim"?

To make sure Puppeteer's API is comprehensive, we built [PhantomShim](https://github.com/GoogleChrome/puppeteer/tree/master/phantom_shim) - a lightweight phantomJS script runner built atop of Puppeteer API. We run phantomJS tests against PhantomShim with an ultimate goal to pass them all.

To emulate PhantomJS which runs automation scripts in-process to the automated page, PhantomShim spawns [nested event loops](https://github.com/abbr/deasync). On practice, this might result in unpredictable side-effects and makes the shim unreliable, but this works pretty good for testing goals.

> **NOTE** It is strictly **not recommended** to use PhantomShim out in the wild.

#### Q: What is the difference between Puppeteer and Selenium / WebDriver?

Selenium / WebDriver is a well-established cross-browser API that is useful for testing cross-browser support.

Puppeteer is useful for single-browser testing. For example, many teams only run unit tests with a single browser (e.g. Phantom). In non-testing use cases, Puppeteer provides a powerful but simple API because it's only targeting one browser that enables you to rapidly develop automation scripts.
