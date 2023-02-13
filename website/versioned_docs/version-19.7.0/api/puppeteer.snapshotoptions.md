---
sidebar_label: SnapshotOptions
---

# SnapshotOptions interface

#### Signature:

```typescript
export interface SnapshotOptions
```

## Properties

| Property                                                           | Modifiers | Type                                                      | Description                                                   | Default                           |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| [interestingOnly?](./puppeteer.snapshotoptions.interestingonly.md) |           | boolean                                                   | <i>(Optional)</i> Prune uninteresting nodes from the tree.    | true                              |
| [root?](./puppeteer.snapshotoptions.root.md)                       |           | [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; | <i>(Optional)</i> Root node to get the accessibility tree for | The root node of the entire page. |
