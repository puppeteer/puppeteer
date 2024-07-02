---
sidebar_label: FrameAddScriptTagOptions
---

# FrameAddScriptTagOptions interface

#### Signature:

```typescript
export interface FrameAddScriptTagOptions
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

<span id="content">content</span>

</td><td>

`optional`

</td><td>

string

</td><td>

JavaScript to be injected into the frame.

</td><td>

</td></tr>
<tr><td>

<span id="id">id</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Sets the `id` of the script.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to a JavaScript file to be injected into the frame.

**Remarks:**

If `path` is a relative path, it is resolved relative to the current working directory (`process.cwd()` in Node.js).

</td><td>

</td></tr>
<tr><td>

<span id="type">type</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Sets the `type` of the script. Use `module` in order to load an ES2015 module.

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

URL of the script to be added.

</td><td>

</td></tr>
</tbody></table>
