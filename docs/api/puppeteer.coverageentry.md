---
sidebar_label: CoverageEntry
---

# CoverageEntry interface

The CoverageEntry class represents one entry of the coverage report.

### Signature

```typescript
export interface CoverageEntry
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

<span id="ranges">ranges</span>

</td><td>

</td><td>

Array&lt;&#123; start: number; end: number; &#125;&gt;

</td><td>

The covered range as start and end positions.

</td><td>

</td></tr>
<tr><td>

<span id="text">text</span>

</td><td>

</td><td>

string

</td><td>

The content of the style sheet or script.

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

</td><td>

string

</td><td>

The URL of the style sheet or script.

</td><td>

</td></tr>
</tbody></table>
