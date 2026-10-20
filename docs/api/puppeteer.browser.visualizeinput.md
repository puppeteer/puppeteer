---
sidebar_label: Browser.visualizeInput
---

# Browser.visualizeInput() method

Configures input visualization for all pages and frames of the browser, including the pages and frames that open after this call. When click visualization is enabled, the browser draws a marker at the position of each click. The marker does not change the DOM, and it shows in screenshots and screencasts.

Each call replaces the previous configuration. To disable input visualization, pass `null`. Disconnecting from the browser also disables the visualization.

### Signature

```typescript
class Browser {
  visualizeInput(options: InputVisualizationOptions | null): Promise<void>;
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

[InputVisualizationOptions](./puppeteer.inputvisualizationoptions.md) \| null

</td><td>

The input visualization options to apply, or `null` to disable input visualization.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Only supported in Chrome with the CDP protocol. Requires a Chrome version that supports `Page.setInputVisualization`.

Pages that open after this call only apply the configuration once Puppeteer creates their [Page](./puppeteer.page.md) object (for example with [Browser.newPage()](./puppeteer.browser.newpage.md), [Browser.pages()](./puppeteer.browser.pages.md) or [Target.page()](./puppeteer.target.page.md)).

## Example

```ts
// Enable click visualization.
await browser.visualizeInput({clicks: true});
// Disable input visualization.
await browser.visualizeInput(null);
```
