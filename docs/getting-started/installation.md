# Installation

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

For a version of Puppeteer without the browser installation, see
[`puppeteer-core`](#puppeteer-core).
