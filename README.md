# Puppeteer Deno

## Full featured Puppeteer for Deno

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right">

###### [API](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md) | [FAQ](#faq) | [Contributing](https://github.com/puppeteer/puppeteer/blob/main/CONTRIBUTING.md) | [Troubleshooting](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md)

> Puppeteer Deno is a Deno library which provides a high-level API to control Chrome or Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Puppeteer runs [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) by default, but can be configured to run full (non-headless) Chrome or Chromium.

<!-- [START usecases] -->

###### What can I do?

Most things that you can do manually in the browser can be done using Puppeteer! Here are a few examples to get you started:

- Generate screenshots and PDFs of pages.
- Crawl a SPA (Single-Page Application) and generate pre-rendered content (i.e. "SSR" (Server-Side Rendering)).
- Automate form submission, UI testing, keyboard input, etc.
- Create an up-to-date, automated testing environment. Run your tests directly in the latest version of Chrome using the latest JavaScript and browser features.
- Capture a [timeline trace](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference) of your site to help diagnose performance issues.
- Test Chrome Extensions.

## Getting Started

### Installation

NO INSTALLATION!
Just import puppeteer from 'https://deno.land/x/puppeteer-deno/mod.ts'.

### This veersion is `puppeteer-core`

`puppeteer-core` is intended to be a lightweight version of Puppeteer for launching an existing browser installation or for connecting to a remote one. Be sure that the version of puppeteer-core you install is compatible with the
browser you intend to connect to.

See [puppeteer vs puppeteer-core](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteer-vs-puppeteer-core).

### Usage

Puppeteer Deno requires latest Deno (1.6.x).
Puppeteer Deno's API will same with latest `puppeteer-core`.
Puppeteer will be familiar to people using other browser testing frameworks. You create an instance
of `Browser`, open pages, and then manipulate them with [Puppeteer's API](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#).

**Example** - navigating to https://example.com and saving a screenshot as _example.png_:

Save file as **example.ts**

```js
import puppeteer from 'https://deno.land/x/puppeteer-deno/mod.ts';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
});

const page = await browser.newPage();

await page.goto('https://google.com');
await page.screenshot({ path: 'example.png' });

await browser.close();
```

Execute script on the command line

```bash
deno run -A example.ts
```

Puppeteer sets an initial page size to 800×600px, which defines the screenshot size. The page size can be customized with [`Page.setViewport()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#pagesetviewportviewport).

**Example** - create a PDF.

Save file as **hn.js**

```js
import puppeteer from 'https://deno.land/x/puppeteer-deno/mod.ts';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
});
const page = await browser.newPage();
await page.goto('https://news.ycombinator.com', {
  waitUntil: 'networkidle2',
});
await page.pdf({ path: 'hn.pdf', format: 'A4' });

await browser.close();
```

Execute script on the command line

```bash
node hn.js
```

See [`Page.pdf()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#pagepdfoptions) for more information about creating pdfs.

**Example** - evaluate script in the context of the page

Save file as **get-dimensions.js**

```js
import puppeteer from 'https://deno.land/x/puppeteer-deno/mod.ts';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
});
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
```

Execute script on the command line

```bash
node get-dimensions.js
```

See [`Page.evaluate()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#pageevaluatepagefunction-args) for more information on `evaluate` and related methods like `evaluateOnNewDocument` and `exposeFunction`.

<!-- [END getstarted] -->

<!-- [START runtimesettings] -->

## Default runtime settings

**1. Uses Headless mode**

Puppeteer launches Chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). To launch a full version of Chromium, set the [`headless` option](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#puppeteerlaunchoptions) when launching a browser:

```js
const browser = await puppeteer.launch({ headless: false }); // default is true
```

**2. Runs a bundled version of Chromium**

WORK IN PROGRESS

```js
const browser = await puppeteer.launch({ executablePath: '/path/to/Chrome' });
```

<!--
You can also use Puppeteer with Firefox Nightly (experimental support). See [`Puppeteer.launch()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#puppeteerlaunchoptions) for more information.

See [`this article`](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [`This article`](https://chromium.googlesource.com/chromium/src/+/master/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users. -->

**3. Creates a fresh user profile**

Puppeteer creates its own browser user profile which it **cleans up on every run**.

<!-- [END runtimesettings] -->

## Resources

- [API Documentation](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md)
- [Examples](https://github.com/puppeteer/puppeteer/tree/main/examples/)
- [Community list of Puppeteer resources](https://github.com/transitive-bullshit/awesome-puppeteer)

## Debugging tips

1.  Turn off headless mode - sometimes it's useful to see what the browser is
    displaying. Instead of launching in headless mode, launch a full version of
    the browser using `headless: false`:

    ```js
    const browser = await puppeteer.launch({ headless: false });
    ```

2.  Slow it down - the `slowMo` option slows down Puppeteer operations by the
    specified amount of milliseconds. It's another way to help see what's going on.

    ```js
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 250, // slow down by 250ms
    });
    ```

3.  Capture console output - You can listen for the `console` event.
    This is also handy when debugging code in `page.evaluate()`:

    ```js
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    await page.evaluate(() => console.log(`url is ${location.href}`));
    ```

4.  Use debugger in application code browser

    There are two execution context: node.js that is running test code, and the browser
    running application code being tested. This lets you debug code in the
    application code browser; ie code inside `evaluate()`.

    - Use `{devtools: true}` when launching Puppeteer:

      ```js
      const browser = await puppeteer.launch({ devtools: true });
      ```

    - Change default test timeout:

      jest: `jest.setTimeout(100000);`

      jasmine: `jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;`

      mocha: `this.timeout(100000);` (don't forget to change test to use [function and not '=>'](https://stackoverflow.com/a/23492442))

    - Add an evaluate statement with `debugger` inside / add `debugger` to an existing evaluate statement:

      ```js
      await page.evaluate(() => {
        debugger;
      });
      ```

      The test will now stop executing in the above evaluate statement, and chromium will stop in debug mode.

<!-- [START faq] -->

# FAQ

#### Q: Who maintains Puppeteer?

The Chrome DevTools team maintains the library, but we'd love your help and expertise on the project!
See [Contributing](https://github.com/puppeteer/puppeteer/blob/main/CONTRIBUTING.md).

#### Q: What is the status of cross-browser support?

I have never tested it on Firefox. But Chrome and Chromium is working well

<!-- From Puppeteer v2.1.0 onwards you can specify [`puppeteer.launch({product: 'firefox'})`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#puppeteerlaunchoptions) to run your Puppeteer scripts in Firefox Nightly, without any additional custom patches. While [an older experiment](https://www.npmjs.com/package/puppeteer-firefox) required a patched version of Firefox, [the current approach](https://wiki.mozilla.org/Remote) works with “stock” Firefox.

We will continue to collaborate with other browser vendors to bring Puppeteer support to browsers such as Safari.
This effort includes exploration of a standard for executing cross-browser commands (instead of relying on the non-standard DevTools Protocol used by Chrome). -->

#### Q: What are Puppeteer Deno’s goals and principles?

The goals of the project are:

- Provide a Full, Complete, Strict Typed version of Puppeteer on Deno platform.
- Same API with original Puppeteer.

#### Q: Where is `Buffer`

Deno has no `Buffer`, so it is replaced with `Uint8Array`

#### Q: What’s considered a “Navigation”?

From Puppeteer’s standpoint, **“navigation” is anything that changes a page’s URL**.
Aside from regular navigation where the browser hits the network to fetch a new document from the web server, this includes [anchor navigations](https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid) and [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) usage.

With this definition of “navigation,” **Puppeteer works seamlessly with single-page applications.**

#### Q: What’s the difference between a “trusted" and "untrusted" input event?

In browsers, input events could be divided into two big groups: trusted vs. untrusted.

- **Trusted events**: events generated by users interacting with the page, e.g. using a mouse or keyboard.
- **Untrusted event**: events generated by Web APIs, e.g. `document.createEvent` or `element.click()` methods.

Websites can distinguish between these two groups:

- using an [`Event.isTrusted`](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted) event flag
- sniffing for accompanying events. For example, every trusted `'click'` event is preceded by `'mousedown'` and `'mouseup'` events.

For automation purposes it’s important to generate trusted events. **All input events generated with Puppeteer are trusted and fire proper accompanying events.** If, for some reason, one needs an untrusted event, it’s always possible to hop into a page context with `page.evaluate` and generate a fake event:

```js
await page.evaluate(() => {
  document.querySelector('button[type=submit]').click();
});
```

#### Q: What features does Puppeteer not support?

You may find that Puppeteer does not behave as expected when controlling pages that incorporate audio and video. (For example, [video playback/screenshots is likely to fail](https://github.com/puppeteer/puppeteer/issues/291).) There are two reasons for this:

- Puppeteer is bundled with Chromium — not Chrome — and so by default, it inherits all of [Chromium's media-related limitations](https://www.chromium.org/audio-video). This means that Puppeteer does not support licensed formats such as AAC or H.264. (However, it is possible to force Puppeteer to use a separately-installed version Chrome instead of Chromium via the [`executablePath` option to `puppeteer.launch`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#puppeteerlaunchoptions). You should only use this configuration if you need an official release of Chrome that supports these media formats.)
- Since Puppeteer (in all configurations) controls a desktop version of Chromium/Chrome, features that are only supported by the mobile version of Chrome are not supported. This means that Puppeteer [does not support HTTP Live Streaming (HLS)](https://caniuse.com/#feat=http-live-streaming).

#### Q: I have more questions! Where do I ask?

report an ISSUE!

<!-- [END faq] -->
