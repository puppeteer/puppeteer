---
sidebar_label: Page.removeScriptToEvaluateOnNewDocument
---

# Page.removeScriptToEvaluateOnNewDocument() method

Removes script that injected into page by Page.evaluateOnNewDocument.

#### Signature:

```typescript
class Page {
  abstract removeScriptToEvaluateOnNewDocument(
    identifier: string
  ): Promise<void>;
}
```

## Parameters

| Parameter  | Type   | Description       |
| ---------- | ------ | ----------------- |
| identifier | string | script identifier |

**Returns:**

Promise&lt;void&gt;
