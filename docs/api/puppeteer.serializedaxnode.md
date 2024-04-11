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

<p id="autocomplete">autocomplete</p>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="checked">checked</p>

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the checkbox is checked, or in a [mixed state](https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html).

</td><td>

</td></tr>
<tr><td>

<p id="children">children</p>

</td><td>

`optional`

</td><td>

[SerializedAXNode](./puppeteer.serializedaxnode.md)\[\]

</td><td>

Children of this node, if there are any.

</td><td>

</td></tr>
<tr><td>

<p id="description">description</p>

</td><td>

`optional`

</td><td>

string

</td><td>

An additional human readable description of the node.

</td><td>

</td></tr>
<tr><td>

<p id="disabled">disabled</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="expanded">expanded</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="focused">focused</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="haspopup">haspopup</p>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="invalid">invalid</p>

</td><td>

`optional`

</td><td>

string

</td><td>

Whether and in what way this node's value is invalid.

</td><td>

</td></tr>
<tr><td>

<p id="keyshortcuts">keyshortcuts</p>

</td><td>

`optional`

</td><td>

string

</td><td>

Any keyboard shortcuts associated with this node.

</td><td>

</td></tr>
<tr><td>

<p id="level">level</p>

</td><td>

`optional`

</td><td>

number

</td><td>

The level of a heading.

</td><td>

</td></tr>
<tr><td>

<p id="modal">modal</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="multiline">multiline</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="multiselectable">multiselectable</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether more than one child can be selected.

</td><td>

</td></tr>
<tr><td>

<p id="name">name</p>

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable name for the node.

</td><td>

</td></tr>
<tr><td>

<p id="orientation">orientation</p>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="pressed">pressed</p>

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the node is checked or in a mixed state.

</td><td>

</td></tr>
<tr><td>

<p id="readonly">readonly</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="required">required</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="role">role</p>

</td><td>

</td><td>

string

</td><td>

The [role](https://www.w3.org/TR/wai-aria/#usage_intro) of the node.

</td><td>

</td></tr>
<tr><td>

<p id="roledescription">roledescription</p>

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable alternative to the role.

</td><td>

</td></tr>
<tr><td>

<p id="selected">selected</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="value">value</p>

</td><td>

`optional`

</td><td>

string \| number

</td><td>

The current value of the node.

</td><td>

</td></tr>
<tr><td>

<p id="valuemax">valuemax</p>

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="valuemin">valuemin</p>

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="valuetext">valuetext</p>

</td><td>

`optional`

</td><td>

string

</td><td>

A description of the current value.

</td><td>

</td></tr>
</tbody></table>
