---
sidebar_label: Locator.waitHandle
---

# Locator.waitHandle() method

Waits for the locator to get a handle from the page.

#### Signature:

```typescript
class Locator \{waitHandle(options?: Readonly<ActionOptions>): Promise<HandleFor<T>>;\}
```

## Parameters

| Parameter | Type                                                          | Description  |
| --------- | ------------------------------------------------------------- | ------------ |
| options   | Readonly&lt;[ActionOptions](./puppeteer.actionoptions.md)&gt; | _(Optional)_ |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;T&gt;&gt;
