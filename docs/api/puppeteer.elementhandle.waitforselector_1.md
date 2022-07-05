---
sidebar_label: ElementHandle.waitForSelector_1
---

# ElementHandle.waitForSelector() method

**Signature:**

```typescript
class ElementHandle {
  waitForSelector(
    selector: string,
    options?: Exclude<WaitForSelectorOptions, 'root'>
  ): Promise<ElementHandle | null>;
}
```

## Parameters

| Parameter | Type                                                                                   | Description       |
| --------- | -------------------------------------------------------------------------------------- | ----------------- |
| selector  | string                                                                                 |                   |
| options   | Exclude&lt;[WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md), 'root'&gt; | <i>(Optional)</i> |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md) \| null&gt;
