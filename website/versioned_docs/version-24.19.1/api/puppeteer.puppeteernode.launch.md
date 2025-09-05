---
sidebar_label: PuppeteerNode.launch
---

# PuppeteerNode.launch() method

Launches a browser instance with given arguments and options when specified.

When using with `puppeteer-core`, [options.executablePath](./puppeteer.launchoptions.md#executablepath) or [options.channel](./puppeteer.launchoptions.md#channel) must be provided.

### Signature

```typescript
class PuppeteerNode {
  launch(options?: LaunchOptions): Promise<Browser>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

[LaunchOptions](./puppeteer.launchoptions.md)

</td><td>

_(Optional)_ Options to configure launching behavior.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Browser](./puppeteer.browser.md)&gt;

## Remarks

Puppeteer can also be used to control the Chrome browser, but it works best with the version of Chrome for Testing downloaded by default. There is no guarantee it will work with any other version. If Google Chrome (rather than Chrome for Testing) is preferred, a [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested. See [this article](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [This article](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users. See [this doc](https://developer.chrome.com/blog/chrome-for-testing/) for the description of Chrome for Testing.

## Example

You can use [options.ignoreDefaultArgs](./puppeteer.launchoptions.md#ignoredefaultargs) to filter out `--mute-audio` from default arguments:

```ts
const browser = await puppeteer.launch({
  ignoreDefaultArgs: ['--mute-audio'],
});
```
