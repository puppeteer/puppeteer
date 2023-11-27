---
sidebar_label: Locator.wait
---

# Locator.wait() method

Waits for the locator to get the serialized value from the page.

Note this requires the value to be JSON-serializable.

#### Signature:

```typescript
class Locator \{wait(options?: Readonly<ActionOptions>): Promise<T>;\}
```

## Parameters

| Parameter | Type                                                          | Description  |
| --------- | ------------------------------------------------------------- | ------------ |
| options   | Readonly&lt;[ActionOptions](./puppeteer.actionoptions.md)&gt; | _(Optional)_ |

**Returns:**

Promise&lt;T&gt;
