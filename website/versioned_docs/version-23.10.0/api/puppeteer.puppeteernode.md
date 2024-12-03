---
sidebar_label: PuppeteerNode
---

# PuppeteerNode class

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

### Signature

```typescript
export declare class PuppeteerNode extends Puppeteer
```

**Extends:** [Puppeteer](./puppeteer.puppeteer.md)

## Remarks

The most common method to use is [launch](./puppeteer.puppeteernode.launch.md), which is used to launch and connect to a new browser instance.

See [the main Puppeteer class](./puppeteer.puppeteer.md) for methods common to all environments, such as [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PuppeteerNode` class.

## Example

The following is a typical example of using Puppeteer to drive automation:

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```

Once you have created a `page` you have access to a large API to interact with the page, navigate, or find certain elements in that page. The [\`page\` documentation](./puppeteer.page.md) lists all the available methods.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="defaultbrowser">defaultBrowser</span>

</td><td>

`readonly`

</td><td>

[SupportedBrowser](./puppeteer.supportedbrowser.md)

</td><td>

The name of the browser that will be launched by default. For `puppeteer`, this is influenced by your configuration. Otherwise, it's `chrome`.

</td></tr>
<tr><td>

<span id="lastlaunchedbrowser">lastLaunchedBrowser</span>

</td><td>

`readonly`

</td><td>

[SupportedBrowser](./puppeteer.supportedbrowser.md)

</td><td>

The name of the browser that was last launched.

</td></tr>
<tr><td>

<span id="product">product</span>

</td><td>

`readonly, deprecated`

</td><td>

string

</td><td>

**Deprecated:**

Do not use as this field as it does not take into account multiple browsers of different types. Use [defaultBrowser](./puppeteer.puppeteernode.md#defaultbrowser) or [lastLaunchedBrowser](./puppeteer.puppeteernode.md#lastlaunchedbrowser).

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="connect">[connect(options)](./puppeteer.puppeteernode.connect.md)</span>

</td><td>

</td><td>

This method attaches Puppeteer to an existing browser instance.

</td></tr>
<tr><td>

<span id="defaultargs">[defaultArgs(options)](./puppeteer.puppeteernode.defaultargs.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">[executablePath(channel)](./puppeteer.puppeteernode.executablepath.md)</span>

</td><td>

</td><td>

The default executable path for a given ChromeReleaseChannel.

</td></tr>
<tr><td>

<span id="executablepath">[executablePath(options)](./puppeteer.puppeteernode.executablepath.md)</span>

</td><td>

</td><td>

The default executable path given LaunchOptions.

</td></tr>
<tr><td>

<span id="executablepath">[executablePath()](./puppeteer.puppeteernode.executablepath.md)</span>

</td><td>

</td><td>

The default executable path.

</td></tr>
<tr><td>

<span id="launch">[launch(options)](./puppeteer.puppeteernode.launch.md)</span>

</td><td>

</td><td>

Launches a browser instance with given arguments and options when specified.

When using with `puppeteer-core`, [options.executablePath](./puppeteer.launchoptions.md#executablepath) or [options.channel](./puppeteer.launchoptions.md#channel) must be provided.

**Remarks:**

Puppeteer can also be used to control the Chrome browser, but it works best with the version of Chrome for Testing downloaded by default. There is no guarantee it will work with any other version. If Google Chrome (rather than Chrome for Testing) is preferred, a [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Dev Channel](https://www.chromium.org/getting-involved/dev-channel) build is suggested. See [this article](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) for a description of the differences between Chromium and Chrome. [This article](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md) describes some differences for Linux users. See [this doc](https://developer.chrome.com/blog/chrome-for-testing/) for the description of Chrome for Testing.

</td></tr>
<tr><td>

<span id="trimcache">[trimCache()](./puppeteer.puppeteernode.trimcache.md)</span>

</td><td>

</td><td>

Removes all non-current Firefox and Chrome binaries in the cache directory identified by the provided Puppeteer configuration. The current browser version is determined by resolving PUPPETEER_REVISIONS from Puppeteer unless `configuration.browserRevision` is provided.

**Remarks:**

Note that the method does not check if any other Puppeteer versions installed on the host that use the same cache directory require the non-current binaries.

</td></tr>
</tbody></table>
