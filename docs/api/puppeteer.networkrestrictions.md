---
sidebar_label: NetworkRestrictions
---

# NetworkRestrictions interface

### Signature

```typescript
export interface NetworkRestrictions
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

<span id="allowlist">allowlist</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

A list of [URLPattern](https://urlpattern.spec.whatwg.org/) strings to allow. Mutually exclusive with [NetworkRestrictions.blocklist](./puppeteer.networkrestrictions.md#blocklist). Passing `[]` or omitting this option means no restriction.

</td><td>

</td></tr>
<tr><td>

<span id="blocklist">blocklist</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

A list of [URLPattern](https://urlpattern.spec.whatwg.org/) strings to block. Mutually exclusive with [NetworkRestrictions.allowlist](./puppeteer.networkrestrictions.md#allowlist). Passing `[]` or omitting this option means no restriction.

</td><td>

</td></tr>
</tbody></table>
