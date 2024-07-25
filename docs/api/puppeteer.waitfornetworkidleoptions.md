---
sidebar_label: WaitForNetworkIdleOptions
---

# WaitForNetworkIdleOptions interface

### Signature

```typescript
export interface WaitForNetworkIdleOptions extends WaitTimeoutOptions
```

**Extends:** [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

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

<span id="concurrency">concurrency</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum number concurrent of network connections to be considered inactive.

</td><td>

`0`

</td></tr>
<tr><td>

<span id="idletime">idleTime</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Time (in milliseconds) the network should be idle.

</td><td>

`500`

</td></tr>
</tbody></table>
