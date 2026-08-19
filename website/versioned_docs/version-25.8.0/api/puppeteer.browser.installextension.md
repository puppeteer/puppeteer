---
sidebar_label: Browser.installExtension
---

# Browser.installExtension() method

Installs an extension and returns the ID.

### Signature

```typescript
class Browser {
  abstract installExtension(
    path: string,
    options?: ExtensionInstallOptions,
  ): Promise<string>;
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
<tr><td>

options

</td><td>

[ExtensionInstallOptions](./puppeteer.extensioninstalloptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;
