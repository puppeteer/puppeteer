---
sidebar_label: QueryOptions
---

# QueryOptions interface

### Signature

```typescript
export interface QueryOptions
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

<span id="isolate">isolate</span>

</td><td>

</td><td>

boolean

</td><td>

Whether to run the query in isolation. When returning many elements from [Page.$$()](./puppeteer.page.__.md) or similar methods, it might be useful to turn off the isolation to improve performance. By default, the querying code will be executed in a separate sandbox realm.

</td><td>

`true`

</td></tr>
</tbody></table>
