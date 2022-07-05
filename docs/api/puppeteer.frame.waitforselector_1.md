---
sidebar_label: Frame.waitForSelector_1
---

# Frame.waitForSelector() method

**Signature:**

```typescript
class Frame {
  waitForSelector(
    selector: string,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description       |
| --------- | --------------------------------------------------------------- | ----------------- |
| selector  | string                                                          |                   |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | <i>(Optional)</i> |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md) \| null&gt;
