---
sidebar_label: Page.removeScriptToEvaluateOnNewDocument
---

# Page.removeScriptToEvaluateOnNewDocument() method

### Signature:

```typescript
class Page {
  abstract removeScriptToEvaluateOnNewDocument(
    identifier: string
  ): Promise<void>;
}
```

Removes script that injected into page by Page.evaluateOnNewDocument.

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

identifier

</td><td>

string

</td><td>

script identifier

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
