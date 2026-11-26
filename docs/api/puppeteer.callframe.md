---
sidebar_label: CallFrame
---

# CallFrame interface

A single location in the JavaScript stack.

### Signature

```typescript
export interface CallFrame
```

## Remarks

Line and column numbers are 0-based and refer to the raw (possibly minified) script coordinates as reported by the browser.

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

<span id="columnnumber">columnNumber</span>

</td><td>

`optional`

</td><td>

number

</td><td>

0-based column number.

</td><td>

</td></tr>
<tr><td>

<span id="functionname">functionName</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Name of the function. Empty string for anonymous functions and top-level code.

</td><td>

</td></tr>
<tr><td>

<span id="linenumber">lineNumber</span>

</td><td>

`optional`

</td><td>

number

</td><td>

0-based line number.

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

URL of the script if known or `undefined` otherwise.

</td><td>

</td></tr>
</tbody></table>
