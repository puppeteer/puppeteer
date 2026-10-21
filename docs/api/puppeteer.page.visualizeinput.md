---
sidebar_label: Page.visualizeInput
---

# Page.visualizeInput() method

Configures input visualization for all frames of this page, including frames that attach after this call. When click visualization is enabled, the browser draws a marker at the position of each click. The marker does not change the DOM, and it shows in screenshots and screencasts.

Each call replaces the previous configuration for this page. To disable input visualization, pass `null`. Disconnecting from the browser also disables the visualization.

### Signature

```typescript
class Page {
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

## Example

```ts
// Enable click visualization on this page.
await page.visualizeInput({clicks: true});
// Disable input visualization on this page.
await page.visualizeInput(null);
```
