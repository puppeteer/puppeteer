---
sidebar_label: Browser.getPWAState
---

# Browser.getPWAState() method

Returns the OS-integration state of an installed Progressive Web App (PWA), such as its badge count and registered file handlers.

### Signature

```typescript
class Browser {
  abstract getPWAState(options: GetPWAStateOptions): Promise<PWAState>;
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

[GetPWAStateOptions](./puppeteer.getpwastateoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[PWAState](./puppeteer.pwastate.md)&gt;

## Remarks

Only available over a pipe connection. See [Browser.installPWA()](./puppeteer.browser.installpwa.md). Meaningful only for an app that is currently installed; querying an unknown manifest id rejects.
