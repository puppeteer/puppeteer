---
sidebar_label: Frame.tap
---

# Frame.tap() method

Taps the first element that matches the `selector`.

#### Signature:

```typescript
class Frame {
  tap(selector: string): Promise<void>;
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

selector

</td><td>

string

</td><td>

The selector to query for.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws if there's no element matching `selector`.
