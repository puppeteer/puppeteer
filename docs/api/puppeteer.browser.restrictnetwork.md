---
sidebar_label: Browser.restrictNetwork
---

# Browser.restrictNetwork() method

Sets the network conditions (blocklist or allowlist) and re-applies the conditions to all targets. To clear all network conditions, omit the argument or pass `null`.

### Signature

```typescript
class Browser {
  restrictNetwork(conditions?: NetworkRestrictions | null): Promise<void>;
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

conditions

</td><td>

[NetworkRestrictions](./puppeteer.networkrestrictions.md) \| null

</td><td>

_(Optional)_ The network conditions to apply.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently only supported for Chrome and the CDP protocol.

Targets that are already on a blocked URL when `restrictNetwork` is called will remain attached and stay on the blocked page. This is a behavior difference compared to launching the browser with network restrictions, where such targets are detached immediately upon initial attach.
