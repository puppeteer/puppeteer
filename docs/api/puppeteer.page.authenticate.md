---
sidebar_label: Page.authenticate
---

# Page.authenticate() method

Provide credentials for `HTTP authentication`.

#### Signature:

```typescript
class Page {
  abstract authenticate(credentials: Credentials): Promise<void>;
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

credentials

</td><td>

[Credentials](./puppeteer.credentials.md)

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

To disable authentication, pass `null`.
