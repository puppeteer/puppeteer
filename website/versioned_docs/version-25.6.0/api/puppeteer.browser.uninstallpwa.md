---
sidebar_label: Browser.uninstallPWA
---

# Browser.uninstallPWA() method

Uninstalls a previously installed Progressive Web App (PWA).

### Signature

```typescript
class Browser {
  abstract uninstallPWA(options: UninstallPWAOptions): Promise<void>;
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

options

</td><td>

[UninstallPWAOptions](./puppeteer.uninstallpwaoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Only available over a pipe connection. See [Browser.installPWA()](./puppeteer.browser.installpwa.md).
