---
sidebar_label: Browser.getExtensionById
---

# Browser.getExtensionById() method

Retrieve a specific extension that is installed in the browser starting from its id.

### Signature

```typescript
class Browser {
  abstract getExtensionById(extensionId: string): Promise<Extension | null>;
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

extensionId

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Extension](./puppeteer.extension.md) \| null&gt;
