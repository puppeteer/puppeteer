---
sidebar_label: SnapshotOptions
---

# SnapshotOptions interface

#### Signature:

```typescript
export interface SnapshotOptions
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="interestingonly">interestingOnly</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Prune uninteresting nodes from the tree.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="root">root</span>

</td><td>

`optional`

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;

</td><td>

Root node to get the accessibility tree for

</td><td>

The root node of the entire page.

</td></tr>
</tbody></table>
