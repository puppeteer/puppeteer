---
sidebar_label: CustomQueryHandler
---

# CustomQueryHandler interface

#### Signature:

```typescript
export interface CustomQueryHandler
```

## Properties

| Property | Modifiers             | Type                                                      | Description | Default |
| -------- | --------------------- | --------------------------------------------------------- | ----------- | ------- |
| queryAll | <code>optional</code> | (node: Node, selector: string) =&gt; Iterable&lt;Node&gt; |             |         |
| queryOne | <code>optional</code> | (node: Node, selector: string) =&gt; Node \| null         |             |         |
