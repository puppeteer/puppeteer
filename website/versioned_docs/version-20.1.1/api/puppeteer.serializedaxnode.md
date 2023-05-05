---
sidebar_label: SerializedAXNode
---

# SerializedAXNode interface

Represents a Node and the properties of it that are relevant to Accessibility.

#### Signature:

```typescript
export interface SerializedAXNode
```

## Properties

| Property        | Modifiers             | Type                                                    | Description                                                                                                                                    | Default |
| --------------- | --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| autocomplete    | <code>optional</code> | string                                                  |                                                                                                                                                |         |
| checked         | <code>optional</code> | boolean \| 'mixed'                                      | Whether the checkbox is checked, or in a [mixed state](https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html). |         |
| children        | <code>optional</code> | [SerializedAXNode](./puppeteer.serializedaxnode.md)\[\] | Children of this node, if there are any.                                                                                                       |         |
| description     | <code>optional</code> | string                                                  | An additional human readable description of the node.                                                                                          |         |
| disabled        | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| expanded        | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| focused         | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| haspopup        | <code>optional</code> | string                                                  |                                                                                                                                                |         |
| invalid         | <code>optional</code> | string                                                  | Whether and in what way this node's value is invalid.                                                                                          |         |
| keyshortcuts    | <code>optional</code> | string                                                  | Any keyboard shortcuts associated with this node.                                                                                              |         |
| level           | <code>optional</code> | number                                                  | The level of a heading.                                                                                                                        |         |
| modal           | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| multiline       | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| multiselectable | <code>optional</code> | boolean                                                 | Whether more than one child can be selected.                                                                                                   |         |
| name            | <code>optional</code> | string                                                  | A human readable name for the node.                                                                                                            |         |
| orientation     | <code>optional</code> | string                                                  |                                                                                                                                                |         |
| pressed         | <code>optional</code> | boolean \| 'mixed'                                      | Whether the node is checked or in a mixed state.                                                                                               |         |
| readonly        | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| required        | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| role            |                       | string                                                  | The [role](https://www.w3.org/TR/wai-aria/#usage_intro) of the node.                                                                           |         |
| roledescription | <code>optional</code> | string                                                  | A human readable alternative to the role.                                                                                                      |         |
| selected        | <code>optional</code> | boolean                                                 |                                                                                                                                                |         |
| value           | <code>optional</code> | string \| number                                        | The current value of the node.                                                                                                                 |         |
| valuemax        | <code>optional</code> | number                                                  |                                                                                                                                                |         |
| valuemin        | <code>optional</code> | number                                                  |                                                                                                                                                |         |
| valuetext       | <code>optional</code> | string                                                  | A description of the current value.                                                                                                            |         |
