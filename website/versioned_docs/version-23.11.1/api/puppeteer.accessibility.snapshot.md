---
sidebar_label: Accessibility.snapshot
---

# Accessibility.snapshot() method

Captures the current state of the accessibility tree. The returned object represents the root accessible node of the page.

### Signature

```typescript
class Accessibility {
  snapshot(options?: SnapshotOptions): Promise<SerializedAXNode | null>;
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

[SnapshotOptions](./puppeteer.snapshotoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[SerializedAXNode](./puppeteer.serializedaxnode.md) \| null&gt;

An AXNode object representing the snapshot.

## Remarks

**NOTE** The Chrome accessibility tree contains nodes that go unused on most platforms and by most screen readers. Puppeteer will discard them as well for an easier to process tree, unless `interestingOnly` is set to `false`.

## Example 1

An example of dumping the entire accessibility tree:

```ts
const snapshot = await page.accessibility.snapshot();
console.log(snapshot);
```

## Example 2

An example of logging the focused node's name:

```ts
const snapshot = await page.accessibility.snapshot();
const node = findFocusedNode(snapshot);
console.log(node && node.name);

function findFocusedNode(node) {
  if (node.focused) return node;
  for (const child of node.children || []) {
    const foundNode = findFocusedNode(child);
    return foundNode;
  }
  return null;
}
```
