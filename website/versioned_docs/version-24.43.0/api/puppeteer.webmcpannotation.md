---
sidebar_label: WebMCPAnnotation
---

# WebMCPAnnotation interface

Tool annotations

### Signature

```typescript
export interface WebMCPAnnotation
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

<span id="autosubmit">autosubmit</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

If the declarative tool was declared with the autosubmit attribute.

</td><td>

</td></tr>
<tr><td>

<span id="readonly">readOnly</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

A hint indicating that the tool does not modify any state.

</td><td>

</td></tr>
<tr><td>

<span id="untrustedcontent">untrustedContent</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

A hint indicating that the tool output may contain untrusted content, ex: UGC, 3rd party data.

</td><td>

</td></tr>
</tbody></table>
