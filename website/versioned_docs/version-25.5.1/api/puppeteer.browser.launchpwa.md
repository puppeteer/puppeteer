---
sidebar_label: Browser.launchPWA
---

# Browser.launchPWA() method

Launches an installed Progressive Web App (PWA) and resolves with the [page](./puppeteer.page.md) backing the app window.

### Signature

```typescript
class Browser {
  abstract launchPWA(options: LaunchPWAOptions): Promise<Page>;
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

[LaunchPWAOptions](./puppeteer.launchpwaoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;

## Remarks

Only available over a pipe connection. See [Browser.installPWA()](./puppeteer.browser.installpwa.md).

`PWA.launch` resolves with the id of the launched \_tab\_ target. Puppeteer does not expose tab targets through [Browser.targets()](./puppeteer.browser.targets.md); this method instead resolves with the tab's child page target (the app's web contents). If Chromium focuses an existing app window, this returns that window's existing page.
