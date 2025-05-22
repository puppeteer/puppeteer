---
sidebar_label: Page.setJavaScriptEnabled
---

# Page.setJavaScriptEnabled() method

### Signature

```typescript
class Page {
  abstract setJavaScriptEnabled(enabled: boolean): Promise<void>;
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

Whether or not to enable JavaScript on the page.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: changing this value won't affect scripts that have already been run. It will take full effect on the next navigation.
