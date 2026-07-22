---
sidebar_label: Browser.installPWA
---

# Browser.installPWA() method

Installs a Progressive Web App (PWA) and returns its manifest id.

### Signature

```typescript
class Browser {
  abstract installPWA(options: InstallPWAOptions): Promise<string>;
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

[InstallPWAOptions](./puppeteer.installpwaoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;

## Remarks

Only available when connected to the browser over a pipe connection (the default when Puppeteer launches the browser). The underlying `PWA` CDP domain is not exposed over a WebSocket connection, and additionally requires launching the browser with the `--enable-devtools-pwa-handler` argument.

The returned manifest id echoes [InstallPWAOptions.manifestId](./puppeteer.installpwaoptions.md#manifestid), so it can be passed directly to [Browser.launchPWA()](./puppeteer.browser.launchpwa.md), [Browser.getPWAState()](./puppeteer.browser.getpwastate.md), or [Browser.uninstallPWA()](./puppeteer.browser.uninstallpwa.md).
