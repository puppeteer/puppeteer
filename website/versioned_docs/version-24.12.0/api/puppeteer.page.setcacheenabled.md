---
sidebar_label: Page.setCacheEnabled
---

# Page.setCacheEnabled() method

Toggles ignoring cache for each request based on the enabled state. By default, caching is enabled.

### Signature

```typescript
class Page {
  abstract setCacheEnabled(enabled?: boolean): Promise<void>;
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

_(Optional)_ sets the `enabled` state of cache

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

#### Default value:

`true`
