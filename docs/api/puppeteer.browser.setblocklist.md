---
sidebar_label: Browser.setBlocklist
---

# Browser.setBlocklist() method

Sets the blocklist of URL patterns and re-applies the conditions to all targets.

### Signature

```typescript
class Browser {
  setBlocklist(_blocklist: string[]): Promise<void>;
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

\_blocklist

</td><td>

string\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently only supported for Chrome and the CDP protocol.
