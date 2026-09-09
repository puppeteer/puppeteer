---
sidebar_label: CustomQueryHandler
---

# CustomQueryHandler interface

### Signature

```typescript
export interface CustomQueryHandler
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

<span id="queryall">queryAll</span>

</td><td>

`optional`

</td><td>

(node: Node, selector: string) =&gt; Iterable&lt;Node&gt;

</td><td>

Searches for some [Nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node) matching the given `selector` from [node](https://developer.mozilla.org/en-US/docs/Web/API/Node).

</td><td>

</td></tr>
<tr><td>

<span id="queryone">queryOne</span>

</td><td>

`optional`

</td><td>

(node: Node, selector: string) =&gt; Node \| null

</td><td>

Searches for a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) matching the given `selector` from [node](https://developer.mozilla.org/en-US/docs/Web/API/Node).

</td><td>

</td></tr>
</tbody></table>
