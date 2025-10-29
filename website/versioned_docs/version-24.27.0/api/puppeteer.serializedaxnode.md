---
sidebar_label: SerializedAXNode
---

# SerializedAXNode interface

Represents a Node and the properties of it that are relevant to Accessibility.

### Signature

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

<span id="autocomplete">autocomplete</span>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="checked">checked</span>

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the checkbox is checked, or in a [mixed state](https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html).

</td><td>

</td></tr>
<tr><td>

<span id="children">children</span>

</td><td>

`optional`

</td><td>

[SerializedAXNode](./puppeteer.serializedaxnode.md)\[\]

</td><td>

Children of this node, if there are any.

</td><td>

</td></tr>
<tr><td>

<span id="description">description</span>

</td><td>

`optional`

</td><td>

string

</td><td>

An additional human readable description of the node.

</td><td>

</td></tr>
<tr><td>

<span id="disabled">disabled</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="expanded">expanded</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="focused">focused</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="haspopup">haspopup</span>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="invalid">invalid</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Whether and in what way this node's value is invalid.

</td><td>

</td></tr>
<tr><td>

<span id="keyshortcuts">keyshortcuts</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Any keyboard shortcuts associated with this node.

</td><td>

</td></tr>
<tr><td>

<span id="level">level</span>

</td><td>

`optional`

</td><td>

number

</td><td>

The level of a heading.

</td><td>

</td></tr>
<tr><td>

<span id="modal">modal</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="multiline">multiline</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="multiselectable">multiselectable</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether more than one child can be selected.

</td><td>

</td></tr>
<tr><td>

<span id="name">name</span>

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable name for the node.

</td><td>

</td></tr>
<tr><td>

<span id="orientation">orientation</span>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="pressed">pressed</span>

</td><td>

`optional`

</td><td>

boolean \| 'mixed'

</td><td>

Whether the node is checked or in a mixed state.

</td><td>

</td></tr>
<tr><td>

<span id="readonly">readonly</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="required">required</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="role">role</span>

</td><td>

</td><td>

string

</td><td>

The [role](https://www.w3.org/TR/wai-aria/#usage_intro) of the node.

</td><td>

</td></tr>
<tr><td>

<span id="roledescription">roledescription</span>

</td><td>

`optional`

</td><td>

string

</td><td>

A human readable alternative to the role.

</td><td>

</td></tr>
<tr><td>

<span id="selected">selected</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Url for link elements.

</td><td>

</td></tr>
<tr><td>

<span id="value">value</span>

</td><td>

`optional`

</td><td>

string \| number

</td><td>

The current value of the node.

</td><td>

</td></tr>
<tr><td>

<span id="valuemax">valuemax</span>

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="valuemin">valuemin</span>

</td><td>

`optional`

</td><td>

number

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="valuetext">valuetext</span>

</td><td>

`optional`

</td><td>

string

</td><td>

A description of the current value.

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="elementhandle">[elementHandle()](./puppeteer.serializedaxnode.elementhandle.md)</span>

</td><td>

Get an ElementHandle for this AXNode if available.

If the underlying DOM element has been disposed, the method might return an error.

</td></tr>
</tbody></table>
