---
sidebar_label: CookiePartitionKey
---

# CookiePartitionKey interface

Represents a cookie partition key in Chrome.

### Signature

```typescript
export interface CookiePartitionKey
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

<span id="hascrosssiteancestor">hasCrossSiteAncestor</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Indicates if the cookie has any ancestors that are cross-site to the topLevelSite.

Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<span id="sourceorigin">sourceOrigin</span>

</td><td>

</td><td>

string

</td><td>

The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie.

In Chrome, maps to the CDP's `topLevelSite` partition key.

</td><td>

</td></tr>
</tbody></table>
