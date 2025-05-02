---
sidebar_label: Page.removeScriptToEvaluateOnNewDocument
---

# Page.removeScriptToEvaluateOnNewDocument() method

Removes script that injected into page by Page.evaluateOnNewDocument.

### Signature

```typescript
class Page {
  abstract removeScriptToEvaluateOnNewDocument(
    identifier: string,
  ): Promise<void>;
}
```

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
