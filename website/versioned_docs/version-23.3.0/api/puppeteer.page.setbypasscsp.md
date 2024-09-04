---
sidebar_label: Page.setBypassCSP
---

# Page.setBypassCSP() method

Toggles bypassing page's Content-Security-Policy.

### Signature

```typescript
class Page {
  abstract setBypassCSP(enabled: boolean): Promise<void>;
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

enabled

</td><td>

boolean

</td><td>

sets bypassing of page's Content-Security-Policy.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: CSP bypassing happens at the moment of CSP initialization rather than evaluation. Usually, this means that `page.setBypassCSP` should be called before navigating to the domain.
