# Puppeteer

<!-- [START badges] -->

[![Build status](https://github.com/puppeteer/puppeteer/workflows/CI/badge.svg)](https://github.com/puppeteer/puppeteer/actions?query=workflow%3ACI) [![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<!-- [END badges] -->

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right"/>

###### [API](https://pptr.dev/api) | [FAQ](https://pptr.dev/faq) | [Contributing](https://pptr.dev/contributing) | [Troubleshooting](https://pptr.dev/troubleshooting)

> Puppeteer is a Node library which provides a high-level API to control Chrome or Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Puppeteer runs [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) by default, but can be configured to run full (non-headless) Chrome or Chromium.

<!-- [START usecases] -->

##### What can I do?

Most things that you can do manually in the browser can be done using Puppeteer! Here are a few examples to get you started:

- Generate screenshots and PDFs of pages.
- Crawl a SPA (Single-Page Application) and generate pre-rendered content (i.e. "SSR" (Server-Side Rendering)).
- Automate form submission, UI testing, keyboard input, etc.
- Create an up-to-date, automated testing environment. Run your tests directly in the latest version of Chrome using the latest JavaScript and browser features.
- Capture a [timeline trace](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference) of your site to help diagnose performance issues.
- Test Chrome Extensions.
<!-- [END usecases] -->

<!-- [START getstarted] -->

## Getting Started

### Installation

To use Puppeteer in your project, run:

```bash
npm i puppeteer
# or "yarn add puppeteer"
```

When you install Puppeteer, it downloads a recent version of Chromium (~170MB Mac, ~282MB Linux, ~280MB Win) that is guaranteed to work with the API (customizable through [Environment Variables](#environment-variables)). For a version of Puppeteer purely for connection, see [`puppeteer-core`](#puppeteer-core).

#### Environment Variables

Puppeteer looks for certain [environment variables](https://en.wikipedia.org/wiki/Environment_variable) to aid its operations.
If Puppeteer doesn't find them in the environment during the installation step, a lowercased variant of these variables will be used from the [npm config](https://docs.npmjs.com/cli/config).

- `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` - defines HTTP proxy settings that are used to download and run the browser.
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - do not download bundled Chromium during installation step.
- `PUPPETEER_TMP_DIR` - defines the directory to be used by Puppeteer for creating temporary files. Defaults to [`os.tmpdir()`](https://nodejs.org/api/os.html#os_os_tmpdir).
- `PUPPETEER_DOWNLOAD_HOST` - overwrite URL prefix that is used to download Chromium. Note: this includes protocol and might even include path prefix. Defaults to `https://storage.googleapis.com`.
- `PUPPETEER_DOWNLOAD_PATH` - overwrite the path for the downloads folder. Defaults to `<root>/.local-chromium`, where `<root>` is Puppeteer's package root.
- `PUPPETEER_CHROMIUM_REVISION` - specify a certain version of Chromium you'd like Puppeteer to use. See [`puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch) on how executable path is inferred.
- `PUPPETEER_EXECUTABLE_PATH` - specify an executable path to be used in [`puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch).
- `PUPPETEER_PRODUCT` - specify which browser you'd like Puppeteer to use. Must be one of `chrome` or `firefox`. This can also be used during installation to fetch the recommended browser binary. Setting `product` programmatically in [`puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch) supersedes this environment variable. The product is exposed in [`puppeteer.product`](https://pptr.dev/api/puppeteer.product)
- `PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM` — specify Puppeteer download Chromium for Apple M1. On Apple M1 devices Puppeteer by default downloads the version for Intel's processor which runs via Rosetta. It works without any problems, however, with this option, you should get more efficient resource usage (CPU and RAM) that could lead to a faster execution time.

:::danger

Puppeteer is only [guaranteed to work](https://pptr.dev/faq#q-why-doesnt-puppeteer-vxxx-work-with-chromium-vyyy) with the bundled Chromium, use at your own risk.

:::

:::caution

`PUPPETEER_*` env variables are not accounted for in [`puppeteer-core`](#puppeteer-core).

:::

#### puppeteer-core

Every release since v1.7.0 we publish two packages:

- [`puppeteer`](https://www.npmjs.com/package/puppeteer)
- [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core)

`puppeteer` is a _product_ for browser automation. When installed, it downloads a version of
Chromium, which it then drives using `puppeteer-core`. Being an end-user product, `puppeteer` supports a bunch of convenient `PUPPETEER_*` env variables to tweak its behavior.

`puppeteer-core` is a _library_ to help drive anything that supports DevTools protocol. `puppeteer-core` doesn't download Chromium when installed. Being a library, `puppeteer-core` is fully driven
through its programmatic interface and disregards all the `PUPPETEER_*` env variables.

To sum up, the only differences between `puppeteer-core` and `puppeteer` are:

- `puppeteer-core` doesn't automatically download Chromium when installed.
- `puppeteer-core` ignores all `PUPPETEER_*` env variables.

In most cases, you'll be fine using the `puppeteer` package.

However, you should use `puppeteer-core` if:

- you're building another end-user product or library atop of DevTools protocol. For example, one might build a PDF generator using `puppeteer-core` and write a custom `install.js` script that downloads [`headless_shell`](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md) instead of Chromium to save disk space.
- you're bundling Puppeteer to use in Chrome Extension / browser with the DevTools protocol where downloading an additional Chromium binary is unnecessary.
- you're building a set of tools where `puppeteer-core` is one of the ingredients and you want to postpone `install.js` script execution until Chromium is about to be used.

When using `puppeteer-core`, remember to change the _include_ line:

```ts
const puppeteer = require('puppeteer-core');
```

You will then need to call [`puppeteer.connect`](https://pptr.dev/api/puppeteer.puppeteer.connect) or [`puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch) with an explicit `executablePath` or `channel` option.

### Usage

Puppeteer follows the latest [maintenance LTS](https://github.com/nodejs/Release#release-schedule) version of Node.

Puppeteer will be familiar to people using other browser testing frameworks. You create an instance
of `Browser`, open pages, and then manipulate them with [Puppeteer's API](https://pptr.dev/api).

**Example** - navigating to https://example.com and saving a screenshot as _example.png_:

Save file as **example.js**

```ts
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
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

Puppeteer sets an initial page size to 800×600px, which defines the screenshot size. The page size can be customized with [`Page.setViewport()`](https://pptr.dev/api/puppeteer.page.setviewport).

**Example** - create a PDF.

Save file as **hn.js**

```ts
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', {
    waitUntil: 'networkidle2',
  });
  await page.pdf({path: 'hn.pdf', format: 'a4'});

  await browser.close();
})();
```

Execute script on the command line

```bash
node hn.js
```

See [`Page.pdf`](https://pptr.dev/api/puppeteer.page.pdf) for more information about creating pdfs.

**Example** - evaluate script in the context of the page

Save file as **get-dimensions.js**

```ts
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
      deviceScaleFactor: window.devicePixelRatio,
    };
  });

  console.log('Dimensions:', dimensions);

  await browser.close();
})();
```

Execute script on the command line

```bash
node get-dimensions.js
```

See [`Page.evaluate`](https://pptr.dev/api/puppeteer.page.evaluate) and related methods like [`Page.evaluateOnNewDocument`](https://pptr.dev/api/puppeteer.page.evaluateOnNewDocument) and [`Page.exposeFunction`](https://pptr.dev/api/puppeteer.page.exposeFunction).

<!-- [END getstarted] -->

### Working with Chrome Extensions

Puppeteer can be used for testing Chrome Extensions.

:::caution

Extensions in Chrome / Chromium currently only work in non-headless mode and experimental Chrome headless mode.

:::

The following is code for getting a handle to the [background page](https://developer.chrome.com/extensions/background_pages) of an extension whose source is located in `./my-extension`:

```ts
const puppeteer = require('puppeteer');

(async () => {
  const pathToExtension = require('path').join(__dirname, 'my-extension');
  const browser = await puppeteer.launch({
    headless: 'chrome',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  const backgroundPageTarget = await browser.waitForTarget(
    target => target.type() === 'background_page'
  );
  const backgroundPage = await backgroundPageTarget.page();
  // Test the background page as you would any other page.
  await browser.close();
})();
```

:::note

Chrome Manifest V3 extensions have a background ServiceWorker of type 'service_worker', instead of a page of type 'background_page'.

:::

:::note

It is not yet possible to test extension popups or content scripts.

:::

<!-- [START runtimesettings] -->

## Default runtime settings

**1. Uses Headless mode**

Puppeteer launches Chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). To launch a full version of Chromium, set the [`headless` option](https://pptr.dev/api/puppeteer.browserlaunchargumentoptions.headless) when launching a browser:

```ts
const browser = await puppeteer.launch({headless: false}); // default is true
```

**2. Runs a bundled version of Chromium**

By default, Puppeteer downloads and uses a specific version of Chromium so its API
is guaranteed to work out of the box. To use Puppeteer with a different version of Chrome or Chromium,
pass in the executable's path when creating a `Browser` instance:

```ts
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```

You can also use Puppeteer with Firefox Nightly (experimental support). See [`Puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch) for more information.

See [`this article`](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [`This article`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users.

**3. Creates a fresh user profile**

Puppeteer creates its own browser user profile which it **cleans up on every run**.

<!-- [END runtimesettings] -->

## Resources

- [API Documentation](https://pptr.dev/api)
- [Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)
- [Community list of Puppeteer resources](https://github.com/transitive-bullshit/awesome-puppeteer)

<!-- [START debugging] -->

## Debugging tips

1.  Turn off headless mode - sometimes it's useful to see what the browser is
    displaying. Instead of launching in headless mode, launch a full version of
    the browser using `headless: false`:

    ```ts
    const browser = await puppeteer.launch({headless: false});
    ```

2.  Slow it down - the `slowMo` option slows down Puppeteer operations by the
    specified amount of milliseconds. It's another way to help see what's going on.

    ```ts
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 250, // slow down by 250ms
    });
    ```

3.  Capture console output - You can listen for the `console` event.
    This is also handy when debugging code in `page.evaluate()`:

    ```ts
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.evaluate(() => console.log(`url is ${location.href}`));
    ```

4.  Use debugger in application code browser

    There are two execution context: node.js that is running test code, and the browser
    running application code being tested. This lets you debug code in the
    application code browser; ie code inside `evaluate()`.

    - Use `{devtools: true}` when launching Puppeteer:

      ```ts
      const browser = await puppeteer.launch({devtools: true});
      ```

    - Change default test timeout:

      jest: `jest.setTimeout(100000);`

      jasmine: `jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;`

      mocha: `this.timeout(100000);` (don't forget to change test to use [function and not '=>'](https://stackoverflow.com/a/23492442))

    - Add an evaluate statement with `debugger` inside / add `debugger` to an existing evaluate statement:

      ```ts
      await page.evaluate(() => {
        debugger;
      });
      ```

      The test will now stop executing in the above evaluate statement, and chromium will stop in debug mode.

5.  Use debugger in node.js

    This will let you debug test code. For example, you can step over `await page.click()` in the node.js script and see the click happen in the application code browser.

    Note that you won't be able to run `await page.click()` in
    DevTools console due to this [Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=833928). So if
    you want to try something out, you have to add it to your test file.

    - Add `debugger;` to your test, eg:

      ```ts
      debugger;
      await page.click('a[target=_blank]');
      ```

    - Set `headless` to `false`
    - Run `node --inspect-brk`, eg `node --inspect-brk node_modules/.bin/jest tests`
    - In Chrome open `chrome://inspect/#devices` and click `inspect`
    - In the newly opened test browser, type `F8` to resume test execution
    - Now your `debugger` will be hit and you can debug in the test browser

6.  Enable verbose logging - internal DevTools protocol traffic
    will be logged via the [`debug`](https://github.com/visionmedia/debug) module under the `puppeteer` namespace.

         # Basic verbose logging
         env DEBUG="puppeteer:*" node script.js

         # Protocol traffic can be rather noisy. This example filters out all Network domain messages
         env DEBUG="puppeteer:*" env DEBUG_COLORS=true node script.js 2>&1 | grep -v '"Network'

7.  Debug your Puppeteer (node) code easily, using [ndb](https://github.com/GoogleChromeLabs/ndb)

- `npm install -g ndb` (or even better, use [npx](https://github.com/zkat/npx)!)

- add a `debugger` to your Puppeteer (node) code

- add `ndb` (or `npx ndb`) before your test command. For example:

  `ndb jest` or `ndb mocha` (or `npx ndb jest` / `npx ndb mocha`)

- debug your test inside chromium like a boss!

<!-- [END debugging] -->

## Contributing

Check out our [contributing guide](https://pptr.dev/contributing) to get an overview of Puppeteer development.

## FAQ

Our [FAQ](https://pptr.dev/faq) has migrated to [our site](https://pptr.dev/faq).
