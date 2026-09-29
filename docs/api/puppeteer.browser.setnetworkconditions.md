---
sidebar_label: Browser.setNetworkConditions
---

# Browser.setNetworkConditions() method

Sets the network conditions (blocklist or allowlist) and re-applies the conditions to all targets. To clear all network conditions, omit the argument or pass `null`.

### Signature

```typescript
class Browser {
  setNetworkConditions(
    _conditions?: {
      blocklist?: string[];
      allowlist?: string[];
    } | null,
  ): Promise<void>;
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

\_conditions

</td><td>

&#123; blocklist?: string\[\]; allowlist?: string\[\]; &#125; \| null

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently only supported for Chrome and the CDP protocol.
