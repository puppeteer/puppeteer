---
sidebar_label: Page.captureHeapSnapshot
---

# Page.captureHeapSnapshot() method

Captures a snapshot of the JavaScript heap and writes it to a file.

### Signature

```typescript
class Page {
  abstract captureHeapSnapshot(options?: {path?: string}): Promise<void>;
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

options

</td><td>

&#123; path?: string; &#125;

</td><td>

_(Optional)_ Options for capturing the heap snapshot.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
