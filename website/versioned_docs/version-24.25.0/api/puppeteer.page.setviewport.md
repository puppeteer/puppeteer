---
sidebar_label: Page.setViewport
---

# Page.setViewport() method

`page.setViewport` will resize the page. A lot of websites don't expect phones to change size, so you should set the viewport before navigating to the page.

In the case of multiple pages in a single browser, each page can have its own viewport size. Setting the viewport to `null` resets the viewport to its default value.

### Signature

```typescript
class Page {
  abstract setViewport(viewport: Viewport | null): Promise<void>;
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

viewport

</td><td>

[Viewport](./puppeteer.viewport.md) \| null

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: in certain cases, setting viewport will reload the page in order to set the isMobile or hasTouch properties.

## Example

```ts
const page = await browser.newPage();
await page.setViewport({
  width: 640,
  height: 480,
  deviceScaleFactor: 1,
});
await page.goto('https://example.com');
```
