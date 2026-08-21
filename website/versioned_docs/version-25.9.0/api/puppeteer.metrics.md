---
sidebar_label: Metrics
---

# Metrics interface

### Signature

```typescript
export interface Metrics
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

<span id="documents">Documents</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Number of documents in the page.

</td><td>

</td></tr>
<tr><td>

<span id="frames">Frames</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Number of frames in the page.

</td><td>

</td></tr>
<tr><td>

<span id="jseventlisteners">JSEventListeners</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Number of events in the page.

</td><td>

</td></tr>
<tr><td>

<span id="jsheaptotalsize">JSHeapTotalSize</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Total JavaScript heap size, in bytes.

</td><td>

</td></tr>
<tr><td>

<span id="jsheapusedsize">JSHeapUsedSize</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Used JavaScript heap size, in bytes.

</td><td>

</td></tr>
<tr><td>

<span id="layoutcount">LayoutCount</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Total number of full or partial page layouts.

</td><td>

</td></tr>
<tr><td>

<span id="layoutduration">LayoutDuration</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Combined duration of all page layouts, in seconds.

</td><td>

</td></tr>
<tr><td>

<span id="nodes">Nodes</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Number of DOM nodes in the page.

</td><td>

</td></tr>
<tr><td>

<span id="recalcstylecount">RecalcStyleCount</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Total number of page style recalculations.

</td><td>

</td></tr>
<tr><td>

<span id="recalcstyleduration">RecalcStyleDuration</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Combined duration of all page style recalculations, in seconds.

</td><td>

</td></tr>
<tr><td>

<span id="scriptduration">ScriptDuration</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Combined duration of JavaScript execution, in seconds.

</td><td>

</td></tr>
<tr><td>

<span id="taskduration">TaskDuration</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Combined duration of all tasks performed by the browser, in seconds.

</td><td>

</td></tr>
<tr><td>

<span id="timestamp">Timestamp</span>

</td><td>

`optional`

</td><td>

number

</td><td>

The timestamp when the metrics sample was taken, in monotonic time (seconds since an arbitrary point in the past).

</td><td>

</td></tr>
</tbody></table>
