---
sidebar_label: Page.screenshot
---

# Page.screenshot() method

Captures a screenshot of this [page](./puppeteer.page.md).

#### Signature:

```typescript
class Page {
  screenshot(
    options: Readonly<ScreenshotOptions> & {
      encoding: 'base64';
    }
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
