---
sidebar_label: Page.setViewport
---

# Page.setViewport() method

`page.setViewport` will resize the page. A lot of websites don't expect phones to change size, so you should set the viewport before navigating to the page.

In the case of multiple pages in a single browser, each page can have its own viewport size.

#### Signature:

```typescript
class Page {
  setViewport(viewport: Viewport): Promise<void>;
}
```

## Parameters

| Parameter | Type                                | Description |
| --------- | ----------------------------------- | ----------- |
| viewport  | [Viewport](./puppeteer.viewport.md) |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

Argument viewport have following properties:

- `width`: page width in pixels. required

- `height`: page height in pixels. required

- `deviceScaleFactor`: Specify device scale factor (can be thought of as DPR). Defaults to `1`.

- `isMobile`: Whether the meta viewport tag is taken into account. Defaults to `false`.

- `hasTouch`: Specifies if viewport supports touch events. Defaults to `false`

- `isLandScape`: Specifies if viewport is in landscape mode. Defaults to false.

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
