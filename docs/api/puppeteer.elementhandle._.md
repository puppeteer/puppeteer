---
sidebar_label: ElementHandle.$
---

# ElementHandle.$() method

Runs `element.querySelector` within the page.

**Signature:**

```typescript
class ElementHandle {
  $<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]> | null>;
}
```

## Parameters

| Parameter | Type     | Description                 |
| --------- | -------- | --------------------------- |
| selector  | Selector | The selector to query with. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt; \| null&gt;

`null` if no element matches the selector.

## Exceptions

`Error` if the selector has no associated query handler.
