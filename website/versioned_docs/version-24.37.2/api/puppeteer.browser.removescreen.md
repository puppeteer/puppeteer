---
sidebar_label: Browser.removeScreen
---

# Browser.removeScreen() method

Removes a screen.

### Signature

```typescript
class Browser {
  abstract removeScreen(screenId: string): Promise<void>;
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

screenId

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Only supported in headless mode. Fails if the primary screen id is specified.
