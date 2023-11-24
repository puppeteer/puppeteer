---
sidebar_label: Page.removeExposedFunction
---

# Page.removeExposedFunction() method

The method removes a previously added function via $[Page.exposeFunction()](./puppeteer.page.exposefunction.md) called `name` from the page's `window` object.

#### Signature:

```typescript
class Page &#123;abstract removeExposedFunction(name: string): Promise<void>;&#125;
```

## Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| name      | string |             |

**Returns:**

Promise&lt;void&gt;
