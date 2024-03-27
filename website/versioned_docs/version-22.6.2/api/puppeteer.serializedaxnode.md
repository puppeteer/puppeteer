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

autocomplete

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

checked

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the checkbox is checked, or in a [mixed state](https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html).

</td><td>

</td></tr>
<tr><td>

children

</td><td>

`optional`

</td><td>

[SerializedAXNode](./puppeteer.serializedaxnode.md)\[\]

</td><td>

Children of this node, if there are any.

</td><td>

</td></tr>
<tr><td>

description

</td><td>

`optional`

</td><td>

string

</td><td>

An additional human readable description of the node.

</td><td>

</td></tr>
<tr><td>

disabled

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

expanded

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

focused

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

haspopup

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

invalid

</td><td>

`optional`

</td><td>

string

</td><td>

Whether and in what way this node's value is invalid.

</td><td>

</td></tr>
<tr><td>

keyshortcuts

</td><td>

`optional`

</td><td>

string

</td><td>

Any keyboard shortcuts associated with this node.

</td><td>

</td></tr>
<tr><td>

level

</td><td>

`optional`

</td><td>

number

</td><td>

The level of a heading.

</td><td>

</td></tr>
<tr><td>

modal

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

multiline

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

multiselectable

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether more than one child can be selected.

</td><td>

</td></tr>
<tr><td>

name

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable name for the node.

</td><td>

</td></tr>
<tr><td>

orientation

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

pressed

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the node is checked or in a mixed state.

</td><td>

</td></tr>
<tr><td>

readonly

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

required

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

role

</td><td>

</td><td>

string

</td><td>

The [role](https://www.w3.org/TR/wai-aria/#usage_intro) of the node.

</td><td>

</td></tr>
<tr><td>

roledescription

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable alternative to the role.

</td><td>

</td></tr>
<tr><td>

selected

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

value

</td><td>

`optional`

</td><td>

string \| number

</td><td>

The current value of the node.

</td><td>

</td></tr>
<tr><td>

valuemax

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

valuemin

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

valuetext

</td><td>

`optional`

</td><td>

string

</td><td>

A description of the current value.

</td><td>

</td></tr>
</tbody></table>
