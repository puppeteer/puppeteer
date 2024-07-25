---
sidebar_label: GoToOptions
---

# GoToOptions interface

### Signature

```typescript
export interface GoToOptions extends WaitForOptions
```

**Extends:** [WaitForOptions](./puppeteer.waitforoptions.md)

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

<span id="referer">referer</span>

</td><td>

`optional`

</td><td>

string

</td><td>

If provided, it will take preference over the referer header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md).

</td><td>

</td></tr>
<tr><td>

<span id="referrerpolicy">referrerPolicy</span>

</td><td>

`optional`

</td><td>

string

</td><td>

If provided, it will take preference over the referer-policy header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md).

</td><td>

</td></tr>
</tbody></table>
