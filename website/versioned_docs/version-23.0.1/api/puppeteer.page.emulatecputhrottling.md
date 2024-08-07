---
sidebar_label: Page.emulateCPUThrottling
---

# Page.emulateCPUThrottling() method

Enables CPU throttling to emulate slow CPUs.

### Signature

```typescript
class Page {
  abstract emulateCPUThrottling(factor: number | null): Promise<void>;
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

factor

</td><td>

number \| null

</td><td>

slowdown factor (1 is no throttle, 2 is 2x slowdown, etc).

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
