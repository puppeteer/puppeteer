---
sidebar_label: SnapshotOptions
---

# SnapshotOptions interface

#### Signature:

```typescript
export interface SnapshotOptions
```

## Properties

| Property        | Modifiers             | Type                                                      | Description                                 | Default                           |
| --------------- | --------------------- | --------------------------------------------------------- | ------------------------------------------- | --------------------------------- |
| interestingOnly | <code>optional</code> | boolean                                                   | Prune uninteresting nodes from the tree.    | <code>true</code>                 |
| root            | <code>optional</code> | [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; | Root node to get the accessibility tree for | The root node of the entire page. |
