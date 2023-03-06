---
sidebar_label: Mouse.wheel
---

# Mouse.wheel() method

Dispatches a `mousewheel` event.

#### Signature:

```typescript
class Mouse {
  wheel(options?: MouseWheelOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                  | Description                                            |
| --------- | ----------------------------------------------------- | ------------------------------------------------------ |
| options   | [MouseWheelOptions](./puppeteer.mousewheeloptions.md) | _(Optional)_ Optional: <code>MouseWheelOptions</code>. |

**Returns:**

Promise&lt;void&gt;

## Example

An example of zooming into an element:

```ts
await page.goto(
  'https://mdn.mozillademos.org/en-US/docs/Web/API/Element/wheel_event$samples/Scaling_an_element_via_the_wheel?revision=1587366'
);

const elem = await page.$('div');
const boundingBox = await elem.boundingBox();
await page.mouse.move(
  boundingBox.x + boundingBox.width / 2,
  boundingBox.y + boundingBox.height / 2
);

await page.mouse.wheel({deltaY: -100});
```
