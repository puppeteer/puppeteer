---
sidebar_label: Locator.click
---

# Locator.click() method

#### Signature:

```typescript
class Locator {
  click(
    clickOptions?: ClickOptions & {
      signal?: AbortSignal;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter    | Type                                                                        | Description  |
| ------------ | --------------------------------------------------------------------------- | ------------ |
| clickOptions | [ClickOptions](./puppeteer.clickoptions.md) &amp; { signal?: AbortSignal; } | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
