---
sidebar_label: Browser.uninstallExtension
---

# Browser.uninstallExtension() method

Uninstalls an extension. In Chrome, this is only available if the browser was created using `pipe: true` and the `--enable-unsafe-extension-debugging` flag is set.

### Signature

```typescript
class Browser {
  abstract uninstallExtension(id: string): Promise<void>;
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

id

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
