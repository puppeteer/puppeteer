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

`PWA.launch` resolves with the id of the launched \_tab\_ target, which is not exposed through the CDP `Target` domain; this method resolves with the tab's child page target (the app's web contents). Launching an app that already has an open window (which the browser may focus instead of opening a new one) rejects once [LaunchPWAOptions.timeout](./puppeteer.launchpwaoptions.md#timeout) elapses.
