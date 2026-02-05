---
sidebar_label: Page.captureHeapSnapshot
---

# Page.captureHeapSnapshot() method

Captures a snapshot of the JavaScript heap and writes it to a file.

### Signature

```typescript
class Page {
  abstract captureHeapSnapshot(options: HeapSnapshotOptions): Promise<void>;
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

[HeapSnapshotOptions](./puppeteer.heapsnapshotoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
