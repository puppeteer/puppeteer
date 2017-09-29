# Puppeteer [![Build Status](https://travis-ci.org/GoogleChrome/puppeteer.svg?branch=master)](https://travis-ci.org/GoogleChrome/puppeteer) [![NPM puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right">

###### [API](docs/api.md) | [FAQ](#faq) | [Contributing](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

> Puppeteer is a Node library which provides a high-level API to control [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) Chrome over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). It can also be configured to use full (non-headless) Chrome.

###### What can I do?

Most things that you can do manually in the browser can be done using Puppeteer! Here are a few examples to get you started:

* Generate screenshots and PDFs of pages.
* Crawl a SPA and generate pre-rendered content (i.e. "SSR").
* Scrape content from websites.
* Automate form submission, UI testing, keyboard input, etc.
* Create an up-to-date, automated testing environment. Run your tests directly in the latest version of Chrome using the latest JavaScript and browser features.
* Capture a [timeline trace](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference) of your site to help diagnose performance issues.

Give it a spin: https://try-puppeteer.appspot.com/

## Getting Started

### Installation

> *Note: Puppeteer requires at least Node v6.4.0, but the examples below use async/await which is only supported in Node v7.6.0 or greater*

To use Puppeteer in your project, run:
```
yarn add puppeteer
# or "npm i puppeteer"
```

> **Note**: When you install Puppeteer, it downloads a recent version of Chromium (~71Mb Mac, ~90Mb Linux, ~110Mb Win) that is guaranteed to work with the API. To skip the download, see [Environment variables](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#environment-variables).

### Usage

Puppeteer will be familiar to people using other browser testing frameworks. You create an instance
of `Browser`, open pages, and then manipulate them with [Puppeteer's API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#).

**Example** - navigating to https://example.com and saving a screenshot as *example.png*:

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();
```

Puppeteer sets an initial page size to 800px x 600px, which defines the screenshot size. The page size can be customized  with [`Page.setViewport()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagesetviewportviewport).

**Example** - create a PDF.

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', {waitUntil: 'networkidle'});
  await page.pdf({path: 'hn.pdf', format: 'A4'});

  await browser.close();
})();
```

See [`Page.pdf()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions) for more information about creating pdfs.

**Example** - evaluate script in the context of the page

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Get the "viewport" of the page, as reported by the page.
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  console.log('Dimensions:', dimensions);

  await browser.close();
})();
```

See [`Page.evaluate()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatepagefunction-args) for more information on `evaluate` and related methods like `evaluateOnNewDocument` and `exposeFunction`.

## Default runtime settings

**1. Uses Headless mode**

Puppeteer launches Chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). To launch a full version of Chromium, set the ['headless' option](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions) when launching a browser:

```js
const browser = await puppeteer.launch({headless: false}); // default is true
```

**2. Runs a bundled version of Chromium**

By default, Puppeteer downloads and uses a specific version of Chromium so its API
is guaranteed to work out of the box. To use Puppeteer with a different version of Chrome,
pass in the executable's path when creating a `Browser` instance:

```js
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```

See [`Puppeteer.launch()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions) for more information.

**3. Creates a fresh user profile**

Puppeteer creates its own Chromium user profile which it **cleans up on every run**.

## API Documentation

Explore the [API documentation](docs/api.md) and [examples](https://github.com/GoogleChrome/puppeteer/tree/master/examples/) to learn more.

## Debugging tips

1. Turn off headless mode - sometimes it's useful to see what the browser is
   displaying. Instead of launching in headless mode, launch a full version of
   Chrome using  `headless: false`:

    ```js
    const browser = await puppeteer.launch({headless: false});
    ```

1. Slow it down - the `slowMo` option slows down Puppeteer operations by the
   specified amount of milliseconds. It's another way to help see what's going on.

    ```js
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 250 // slow down by 250ms
    });
    ```

1. Capture console output - You can listen for the `console` event.
   This is also handy when debugging code in `page.evaluate()`:

    ```js
    page.on('console', msg => console.log('PAGE LOG:', ...msg.args));

    await page.evaluate(() => console.log(`url is ${location.href}`));
    ```


1. Enable verbose logging - All public API calls and internal protocol traffic
   will be logged via the [`debug`](https://github.com/visionmedia/debug) module.

   ```sh
   # Basic verbose logging
   env DEBUG="*" node script.js

   # Debug output can be enabled/disabled by namespace
   env DEBUG="*,-*:protocol" node script.js # everything BUT protocol messages
   env DEBUG="*:session" node script.js # protocol session messages (protocol messages to targets)
   env DEBUG="*:mouse,*:keyboard" node script.js # only Mouse and Keyboard API calls

   # Protocol traffic can be rather noisy. This example filters out all Network domain messages
   env DEBUG="*" env DEBUG_COLORS=true node script.js 2>&1 | grep -v '"Network'
   ```




## Contributing to Puppeteer

Check out [contributing guide](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md) to get an overview of Puppeteer development.

# FAQ

#### Q: Which Chromium version does Puppeteer use?

Look for `chromium_revision` in [package.json](https://github.com/GoogleChrome/puppeteer/blob/master/package.json).

Puppeteer bundles Chromium to ensure that the latest features it uses are guaranteed to be available. As the DevTools protocol and browser improve over time, Puppeteer will be updated to depend on newer versions of Chromium.

#### Q: What is the difference between Puppeteer, Selenium / WebDriver, and PhantomJS?

Selenium / WebDriver is a well-established cross-browser API that is useful for testing cross-browser support.

Puppeteer works only with Chrome. However, many teams only run unit tests with a single browser (e.g. PhantomJS). In non-testing use cases, Puppeteer provides a powerful but simple API because it's only targeting one browser that enables you to rapidly develop automation scripts.

Puppeteer uses the latest versions of Chromium.

#### Q: Who maintains Puppeteer?

The Chrome DevTools team maintains the library, but we'd love your help and expertise on the project!
See [Contributing](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md).

#### Q: Why is the Chrome team building Puppeteer?

The goals of the project are simple:

- Provide a slim, canonical library that highlights the capabilities of the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
- Provide a reference implementation for similar testing libraries. Eventually, these
other frameworks could adopt Puppeteer as their foundational layer.
- Grow the adoption of headless/automated browser testing.
- Help dogfood new DevTools Protocol features...and catch bugs!
- Learn more about the pain points of automated browser testing and help fill those gaps.

#### Q: How does Puppeteer compare with other headless Chrome projects?

The past few months have brought [several new libraries for automating headless Chrome](https://medium.com/@kensoh/chromeless-chrominator-chromy-navalia-lambdium-ghostjs-autogcd-ef34bcd26907). As the team authoring the underlying DevTools Protocol, we're excited to witness and support this flourishing ecosystem.

We've reached out to a number of these projects to see if there are opportunities for collaboration, and we're happy to do what we can to help.
