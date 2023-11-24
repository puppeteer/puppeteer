---
sidebar_label: Page.removeScriptToEvaluateOnNewDocument
---

# Page.removeScriptToEvaluateOnNewDocument() method

Removes script that injected into page by Page.evaluateOnNewDocument.

#### Signature:

```typescript
class Page &#123;abstract removeScriptToEvaluateOnNewDocument(identifier: string): Promise<void>;&#125;
```

## Parameters

| Parameter  | Type   | Description       |
| ---------- | ------ | ----------------- |
| identifier | string | script identifier |

**Returns:**

Promise&lt;void&gt;
