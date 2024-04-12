# Installation

To use Puppeteer in your project, run:

```bash npm2yarn
npm i puppeteer
```

When you install Puppeteer, it automatically downloads a recent version of
[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) (~170MB macOS, ~282MB Linux, ~280MB Windows) and a `chrome-headless-shell` binary (starting with Puppeteer v21.6.0) that is [guaranteed to
work](https://pptr.dev/faq#q-why-doesnt-puppeteer-vxxx-work-with-chromium-vyyy)
with Puppeteer. The browser is downloaded to the `$HOME/.cache/puppeteer` folder
by default (starting with Puppeteer v19.0.0). See [configuration](https://pptr.dev/api/puppeteer.configuration) for configuration options and environmental variables to control the download behavior.

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
