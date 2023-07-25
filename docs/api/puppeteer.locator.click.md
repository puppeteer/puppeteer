---
sidebar_label: Locator.click
---

# Locator.click() method

#### Signature:

```typescript
class Locator {
  click<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                      | Description  |
| --------- | ------------------------------------------------------------------------- | ------------ |
| this      | [Locator](./puppeteer.locator.md)&lt;ElementType&gt;                      |              |
| options   | Readonly&lt;[LocatorClickOptions](./puppeteer.locatorclickoptions.md)&gt; | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
