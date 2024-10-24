---
sidebar_label: Page.screenshot
---

# Page.screenshot() method

<h2 id="screenshot">screenshot(): Promise&lt;string&gt;</h2>

Captures a screenshot of this [page](./puppeteer.page.md).

### Signature

```typescript
class Page {
  screenshot(
    options: Readonly<ScreenshotOptions> & {
      encoding: 'base64';
    },
  ): Promise<string>;
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

Readonly&lt;[ScreenshotOptions](./puppeteer.screenshotoptions.md)&gt; &amp; &#123; encoding: 'base64'; &#125;

</td><td>

Configures screenshot behavior.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string&gt;

## Remarks

While a screenshot is being taken in a [BrowserContext](./puppeteer.browsercontext.md), the following methods will automatically wait for the screenshot to finish to prevent interference with the screenshot process: [BrowserContext.newPage()](./puppeteer.browsercontext.newpage.md), [Browser.newPage()](./puppeteer.browser.newpage.md), [Page.close()](./puppeteer.page.close.md).

Calling [Page.bringToFront()](./puppeteer.page.bringtofront.md) will not wait for existing screenshot operations.

<h2 id="screenshot-1">screenshot(): Promise&lt;Uint8Array&gt;</h2>

### Signature

```typescript
class Page {
  screenshot(options?: Readonly<ScreenshotOptions>): Promise<Uint8Array>;
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

Readonly&lt;[ScreenshotOptions](./puppeteer.screenshotoptions.md)&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Uint8Array&gt;
