---
sidebar_label: Page.close
---

# Page.close() method

#### Signature:

```typescript
class Page {
  abstract close(options?: {runBeforeUnload?: boolean}): Promise<void>;
}
```

## Parameters

| Parameter | Type                                     | Description  |
| --------- | ---------------------------------------- | ------------ |
| options   | &#123; runBeforeUnload?: boolean; &#125; | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
