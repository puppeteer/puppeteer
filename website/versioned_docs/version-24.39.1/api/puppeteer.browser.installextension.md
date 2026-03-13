---
sidebar_label: Browser.installExtension
---

# Browser.installExtension() method

Installs an extension and returns the ID. In Chrome, this is only available if the browser was created using `pipe: true` and the `--enable-unsafe-extension-debugging` flag is set.

### Signature

```typescript
class Browser {
  abstract installExtension(path: string): Promise<string>;
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

path

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;
