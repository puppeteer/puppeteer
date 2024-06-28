---
sidebar_label: ElementHandle.screenshot
---

# ElementHandle.screenshot() method

<h2 id="overload-0">screenshot(options: Readonly&lt;ScreenshotOptions&gt; &amp; &#123; encoding: 'base64'; &#125;): Promise&lt;string&gt;;</h2>

### Signature:

```typescript
class ElementHandle {
  screenshot(
    options: Readonly<ScreenshotOptions> & {
      encoding: 'base64';
    }
  ): Promise<string>;
}
```

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

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

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string&gt;

<h2 id="overload-1">screenshot(options?: Readonly&lt;ScreenshotOptions&gt;): Promise&lt;Buffer&gt;;</h2>

### Signature:

```typescript
class ElementHandle {
  screenshot(options?: Readonly<ScreenshotOptions>): Promise<Buffer>;
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

Promise&lt;Buffer&gt;
