---
sidebar_label: CustomQueryHandler
---

# CustomQueryHandler interface

#### Signature:

```typescript
export interface CustomQueryHandler
```

## Properties

| Property | Modifiers             | Type                                                      | Description                                                                                                                                                                                   | Default |
| -------- | --------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| queryAll | <code>optional</code> | (node: Node, selector: string) =&gt; Iterable&lt;Node&gt; | Searches for some [Nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node) matching the given <code>selector</code> from [node](https://developer.mozilla.org/en-US/docs/Web/API/Node). |         |
| queryOne | <code>optional</code> | (node: Node, selector: string) =&gt; Node \| null         | Searches for a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) matching the given <code>selector</code> from [node](https://developer.mozilla.org/en-US/docs/Web/API/Node).     |         |
