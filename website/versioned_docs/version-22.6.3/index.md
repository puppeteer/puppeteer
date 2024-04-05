# Puppeteer

[![build](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml)
[![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right"/>

#### [Guides](https://pptr.dev/category/guides) | [API](https://pptr.dev/api) | [FAQ](https://pptr.dev/faq) | [Contributing](https://pptr.dev/contributing) | [Troubleshooting](https://pptr.dev/troubleshooting)

> Puppeteer is a Node.js library which provides a high-level API to control
> Chrome/Chromium over the
> [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
> Puppeteer runs in
> [headless](https://developer.chrome.com/docs/chromium/new-headless/)
> mode by default, but can be configured to run in full ("headful")
> Chrome/Chromium.

#### What can I do?

Most things that you can do manually in the browser can be done using Puppeteer!
Here are a few examples to get you started:

- Generate screenshots and PDFs of pages.
- Crawl a SPA (Single-Page Application) and generate pre-rendered content (i.e.
  "SSR" (Server-Side Rendering)).
- Automate form submission, UI testing, keyboard input, etc.
- Create an automated testing environment using the latest JavaScript and
  browser features.
- Capture a
  [timeline trace](https://developer.chrome.com/docs/devtools/performance/reference)
  of your site to help diagnose performance issues.
- [Test Chrome Extensions](https://pptr.dev/guides/chrome-extensions).

## Getting Started

### Installation

To use Puppeteer in your project, run:

```bash
npm i puppeteer
# or using yarn
yarn add puppeteer
# or using pnpm
pnpm i puppeteer
```

When you install Puppeteer, it automatically downloads a recent version of
[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) (~170MB macOS, ~282MB Linux, ~280MB Windows) and a `chrome-headless-shell` binary (starting with Puppeteer v21.6.0) that is [guaranteed to
work](https://pptr.dev/faq#q-why-doesnt-puppeteer-vxxx-work-with-chromium-vyyy)
with Puppeteer. The browser is downloaded to the `$HOME/.cache/puppeteer` folder
by default (starting with Puppeteer v19.0.0). See [configuration](https://pptr.dev/api/puppeteer.configuration) for configuration options and environmental variables to control the download behavor.

If you deploy a project using Puppeteer to a hosting provider, such as Render or
Heroku, you might need to reconfigure the location of the cache to be within
your project folder (see an example below) because not all hosting providers
include `$HOME/.cache` into the project's deployment.

For a version of Puppeteer without the browser installation, see
[`puppeteer-core`](#puppeteer-core).

If used with TypeScript, the minimum supported TypeScript version is `4.7.4`.

#### Configuration

Puppeteer uses several defaults that can be customized through configuration
files.

For example, to change the default cache directory Puppeteer uses to install
browsers, you can add a `.puppeteerrc.cjs` (or `puppeteer.config.cjs`) at the
root of your application with the contents

```js
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
```

After adding the configuration file, you will need to remove and reinstall
`puppeteer` for it to take effect.

See the [configuration guide](https://pptr.dev/guides/configuration) for more
information.

#### `puppeteer-core`

For every release since v1.7.0 we publish two packages:

- [`puppeteer`](https://www.npmjs.com/package/puppeteer)
- [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core)

`puppeteer` is a _product_ for browser automation. When installed, it downloads
a version of Chrome, which it then drives using `puppeteer-core`. Being an
end-user product, `puppeteer` automates several workflows using reasonable
defaults [that can be customized](https://pptr.dev/guides/configuration).

`puppeteer-core` is a _library_ to help drive anything that supports DevTools
protocol. Being a library, `puppeteer-core` is fully driven through its
programmatic interface implying no defaults are assumed and `puppeteer-core`
will not download Chrome when installed.

You should use `puppeteer-core` if you are
[connecting to a remote browser](https://pptr.dev/api/puppeteer.puppeteer.connect)
or [managing browsers yourself](https://pptr.dev/browsers-api/).
If you are managing browsers yourself, you will need to call
[`puppeteer.launch`](https://pptr.dev/api/puppeteer.puppeteernode.launch) with
an explicit
[`executablePath`](https://pptr.dev/api/puppeteer.launchoptions)
(or [`channel`](https://pptr.dev/api/puppeteer.launchoptions) if it's
installed in a standard location).

When using `puppeteer-core`, remember to change the import:

```ts
import puppeteer from 'puppeteer-core';
```

### Usage

Puppeteer follows the latest
[maintenance LTS](https://github.com/nodejs/Release#release-schedule) version of
Node.

Puppeteer will be familiar to people using other browser testing frameworks. You
[launch](https://pptr.dev/api/puppeteer.puppeteernode.launch)/[connect](https://pptr.dev/api/puppeteer.puppeteernode.connect)
a [browser](https://pptr.dev/api/puppeteer.browser),
[create](https://pptr.dev/api/puppeteer.browser.newpage) some
[pages](https://pptr.dev/api/puppeteer.page), and then manipulate them with
[Puppeteer's API](https://pptr.dev/api).

For more in-depth usage, check our [guides](https://pptr.dev/category/guides)
and [examples](https://github.com/puppeteer/puppeteer/tree/main/examples).

#### Example

The following example searches [developer.chrome.com](https://developer.chrome.com/) for blog posts with text "automate beyond recorder", click on the first result and print the full title of the blog post.

```ts
import puppeteer from 'puppeteer';

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://developer.chrome.com/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box
  await page.type('.devsite-search-field', 'automate beyond recorder');

  // Wait and click on first result
  const searchResultSelector = '.devsite-result-item-link';
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  // Locate the full title with a unique string
  const textSelector = await page.waitForSelector(
    'text/Customize and automate'
  );
  const fullTitle = await textSelector?.evaluate(el => el.textContent);

  // Print the full title
  console.log('The title of this blog post is "%s".', fullTitle);

  await browser.close();
})();
```

### Default runtime settings

**1. Uses Headless mode**

By default Puppeteer launches Chrome in
[the Headless mode](https://developer.chrome.com/docs/chromium/new-headless/).

```ts
const browser = await puppeteer.launch();
// Equivalent to
const browser = await puppeteer.launch({headless: true});
```

Before v22, Puppeteer launched the [old Headless mode](https://developer.chrome.com/docs/chromium/new-headless/) by default.
The old headless mode is now known as
[`chrome-headless-shell`](https://developer.chrome.com/blog/chrome-headless-shell)
and ships as a separate binary. `chrome-headless-shell` does not match the
behavior of the regular Chrome completely but it is currently more performant
for automation tasks where the complete Chrome feature set is not needed. If the performance
is more important for your use case, switch to `chrome-headless-shell` as following:

```ts
const browser = await puppeteer.launch({headless: 'shell'});
```

To launch a "headful" version of Chrome, set the
[`headless`](https://pptr.dev/api/puppeteer.browserlaunchargumentoptions) to `false`
option when launching a browser:

```ts
const browser = await puppeteer.launch({headless: false});
```

**2. Runs a bundled version of Chrome**

By default, Puppeteer downloads and uses a specific version of Chrome so its
API is guaranteed to work out of the box. To use Puppeteer with a different
version of Chrome or Chromium, pass in the executable's path when creating a
`Browser` instance:

```ts
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```

You can also use Puppeteer with Firefox. See
[status of cross-browser support](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support) for
more information.

See
[`this article`](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/)
for a description of the differences between Chromium and Chrome.
[`This article`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/chromium_browser_vs_google_chrome.md)
describes some differences for Linux users.

**3. Creates a fresh user profile**

Puppeteer creates its own browser user profile which it **cleans up on every
run**.

#### Using Docker

See our [Docker guide](https://pptr.dev/guides/docker).

#### Using Chrome Extensions

See our [Chrome extensions guide](https://pptr.dev/guides/chrome-extensions).

## Resources

- [API Documentation](https://pptr.dev/api)
- [Guides](https://pptr.dev/category/guides)
- [Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)
- [Community list of Puppeteer resources](https://github.com/transitive-bullshit/awesome-puppeteer)

## Contributing

Check out our [contributing guide](https://pptr.dev/contributing) to get an
overview of Puppeteer development.

## FAQ

Our [FAQ](https://pptr.dev/faq) has migrated to
[our site](https://pptr.dev/faq).
