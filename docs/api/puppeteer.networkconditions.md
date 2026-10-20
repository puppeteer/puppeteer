---
sidebar_label: NetworkConditions
---

# NetworkConditions interface

### Signature

```typescript
export interface NetworkConditions
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

<span id="download">download</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Download speed (bytes/s). If not provided, download throttling is disabled and only the offline mode is emulated.

</td><td>

</td></tr>
<tr><td>

<span id="latency">latency</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Latency (ms). If not provided, no latency is emulated.

</td><td>

</td></tr>
<tr><td>

<span id="offline">offline</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Emulates the offline mode.

**Remarks:**

Shortcut for [Page.setOfflineMode()](./puppeteer.page.setofflinemode.md).

</td><td>

</td></tr>
<tr><td>

<span id="upload">upload</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Upload speed (bytes/s). If not provided, upload throttling is disabled and only the offline mode is emulated.

</td><td>

</td></tr>
</tbody></table>
