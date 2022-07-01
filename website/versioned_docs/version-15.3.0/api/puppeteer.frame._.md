---
sidebar_label: Frame.$
---

# Frame.$() method

This method queries the frame for the given selector.

**Signature:**

```typescript
class Frame {
  $<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]> | null>;
}
```

## Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| selector  | Selector | a selector to query for. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt; \| null&gt;

A promise which resolves to an `ElementHandle` pointing at the element, or `null` if it was not found.
