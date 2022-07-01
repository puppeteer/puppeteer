---
sidebar_label: ElementHandle.$$
---

# ElementHandle.$$() method

Runs `element.querySelectorAll` within the page.

**Signature:**

```typescript
class ElementHandle {
  $$<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]>[]>;
}
```

## Parameters

| Parameter | Type     | Description                 |
| --------- | -------- | --------------------------- |
| selector  | Selector | The selector to query with. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt;\[\]&gt;

`[]` if no element matches the selector.

## Exceptions

`Error` if the selector has no associated query handler.
