---
sidebar_label: PuppeteerNode.launch
---

# PuppeteerNode.launch() method

Launches a browser instance with given arguments and options when specified.

When using with `puppeteer-core`, [options.executablePath](./puppeteer.launchoptions.executablepath.md) or [options.channel](./puppeteer.launchoptions.channel.md) must be provided.

#### Signature:

```typescript
class PuppeteerNode {
  launch(options?: PuppeteerLaunchOptions): Promise<Browser>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                |
| --------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| options   | [PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md) | <i>(Optional)</i> Options to configure launching behavior. |

**Returns:**

Promise&lt;[Browser](./puppeteer.browser.md)&gt;

## Remarks

Puppeteer can also be used to control the Chrome browser, but it works best with the version of Chromium downloaded by default by Puppeteer. There is no guarantee it will work with any other version. If Google Chrome (rather than Chromium) is preferred, a [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested. See [this article](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [This article](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users.

## Example

You can use [options.ignoreDefaultArgs](./puppeteer.launchoptions.ignoredefaultargs.md) to filter out `--mute-audio` from default arguments:

```ts
const browser = await puppeteer.launch({
  ignoreDefaultArgs: ['--mute-audio'],
});
```
