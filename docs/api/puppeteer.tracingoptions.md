---
sidebar_label: TracingOptions
---

# TracingOptions interface

### Signature

```typescript
export interface TracingOptions
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

<span id="buffersize">bufferSize</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Size of the trace buffer in kilobytes. If not specified or zero is passed, the default value of 200 MB (200,000 KB) is used by Chromium.

</td><td>

</td></tr>
<tr><td>

<span id="categories">categories</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

The tracing categories to include/exclude.

To exclude a category, prefix it with `-` (e.g., `-toplevel`).

</td><td>

Default categories listed in the implementation.

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The file path to write the trace to. If no path is specified, the trace will not be written to disk, but can still be retrieved as a `Uint8Array` from `tracing.stop()`.

</td><td>

</td></tr>
<tr><td>

<span id="screenshots">screenshots</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to capture screenshots in the trace.

</td><td>

`false`

</td></tr>
</tbody></table>
