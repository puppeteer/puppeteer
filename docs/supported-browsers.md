# Supported browsers

## Chrome

Starting with v20.0.0 Puppeteer downloads and works with **[Chrome for Testing](https://github.com/GoogleChromeLabs/chrome-for-testing?tab=readme-ov-file#what-is-chrome-for-testing)**, which supports both headless and headful modes sharing the same code path in the browser.
The old headless mode is now a separate program called **[chrome-headless-shell](https://developer.chrome.com/blog/chrome-headless-shell)** (use `headless: 'shell'` with Puppeteer).

Prior to this version Puppeteer downloaded and worked with Chromium.

## Firefox

Starting with v23.0.0 Puppeteer downloads and works with the stable release of [Firefox](https://www.mozilla.org/en-US/firefox/).

Prior to this version Puppeteer downloaded and worked with the nightly versions of Firefox at the time.

## Supported browser version list

The following table provides mapping between the Puppeteer version and the browsers version you can use it with.
If an exact matching version of Puppeteer isn't listed, the supported version of the browser is that for the immediately prior version:

<!-- version-list -->
