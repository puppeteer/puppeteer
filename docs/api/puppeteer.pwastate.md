---
sidebar_label: PWAState
---

# PWAState interface

The OS-integration state of an installed web app, returned by [Browser.getPWAState()](./puppeteer.browser.getpwastate.md).

### Signature

```typescript
export interface PWAState
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="badgecount">badgeCount</span>

</td><td>

</td><td>

number

</td><td>

The current badge count shown on the app icon.

</td><td>

</td></tr>
<tr><td>

<span id="filehandlers">fileHandlers</span>

</td><td>

</td><td>

Protocol.PWA.FileHandler\[\]

</td><td>

The file handlers registered by the app with the OS.

</td><td>

</td></tr>
</tbody></table>
