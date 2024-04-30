---
sidebar_label: FrameAddStyleTagOptions
---

# FrameAddStyleTagOptions interface

#### Signature:

```typescript
export interface FrameAddStyleTagOptions
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

Raw CSS content to be injected into the frame.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The path to a CSS file to be injected into the frame.

**Remarks:**

If `path` is a relative path, it is resolved relative to the current working directory (`process.cwd()` in Node.js).

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

the URL of the CSS file to be added.

</td><td>

</td></tr>
</tbody></table>
