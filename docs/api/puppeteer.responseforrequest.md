---
sidebar_label: ResponseForRequest
---

# ResponseForRequest interface

Required response data to fulfill a request with.

#### Signature:

```typescript
export interface ResponseForRequest
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

body

</td><td>

</td><td>

string \| Buffer

</td><td>

</td><td>

</td></tr>
<tr><td>

contentType

</td><td>

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

headers

</td><td>

</td><td>

Record&lt;string, unknown&gt;

</td><td>

Optional response headers. All values are converted to strings.

</td><td>

</td></tr>
<tr><td>

status

</td><td>

</td><td>

number

</td><td>

</td><td>

</td></tr>
</tbody></table>
