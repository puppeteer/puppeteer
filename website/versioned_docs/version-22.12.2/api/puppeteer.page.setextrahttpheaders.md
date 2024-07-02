---
sidebar_label: Page.setExtraHTTPHeaders
---

# Page.setExtraHTTPHeaders() method

The extra HTTP headers will be sent with every request the page initiates.

:::tip

All HTTP header names are lowercased. (HTTP headers are case-insensitive, so this shouldn’t impact your server code.)

:::

:::note

page.setExtraHTTPHeaders does not guarantee the order of headers in the outgoing requests.

:::

#### Signature:

```typescript
class Page {
  abstract setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

headers

</td><td>

Record&lt;string, string&gt;

</td><td>

An object containing additional HTTP headers to be sent with every request. All header values must be strings.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
