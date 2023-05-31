---
sidebar_label: Page.once
---

# Page.once() method

#### Signature:

```typescript
class Page {
  once<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): this;
}
```

## Parameters

| Parameter | Type                                                                       | Description |
| --------- | -------------------------------------------------------------------------- | ----------- |
| eventName | K                                                                          |             |
| handler   | (event: [PageEventObject](./puppeteer.pageeventobject.md)\[K\]) =&gt; void |             |

**Returns:**

this
