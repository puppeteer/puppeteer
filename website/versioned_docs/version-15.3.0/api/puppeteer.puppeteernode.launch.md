---
sidebar_label: PuppeteerNode.launch
---

# PuppeteerNode.launch() method

Launches puppeteer and launches a browser instance with given arguments and options when specified.

**Signature:**

```typescript
class PuppeteerNode {
  launch(options?: PuppeteerLaunchOptions): Promise<Browser>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                          |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| options   | [PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md) | <i>(Optional)</i> Set of configurable options to set on the browser. |

**Returns:**

Promise&lt;[Browser](./puppeteer.browser.md)&gt;

Promise which resolves to browser instance.

## Remarks

\*\*NOTE\*\* Puppeteer can also be used to control the Chrome browser, but it works best with the version of Chromium it is bundled with. There is no guarantee it will work with any other version. Use `executablePath` option with extreme caution. If Google Chrome (rather than Chromium) is preferred, a [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested. In `puppeteer.launch([options])`, any mention of Chromium also applies to Chrome. See [this article](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [This article](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users.

## Example

You can use `ignoreDefaultArgs` to filter out `--mute-audio` from default arguments:

```ts
const browser = await puppeteer.launch({
  ignoreDefaultArgs: ['--mute-audio'],
});
```
