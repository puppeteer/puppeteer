---
sidebar_label: Browser.setAllowlist
---

# Browser.setAllowlist() method

Sets the allowlist of URL patterns and re-applies the conditions to all targets.

### Signature

```typescript
class Browser {
  setAllowlist(_allowlist: string[]): Promise<void>;
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

\_allowlist

</td><td>

string\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently only supported for Chrome and the CDP protocol.
