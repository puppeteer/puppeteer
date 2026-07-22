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

Resolves with the newly opened app-window page. Because the launched app-window target is not surfaced through the CDP `Target` domain, the page is matched by origin; launching an app that already has an open window (which the browser may focus instead of opening a new one) rejects once [LaunchPWAOptions.timeout](./puppeteer.launchpwaoptions.md#timeout) elapses.
