---
sidebar_label: Cookie
---

# Cookie interface

Represents a cookie object.

### Signature

```typescript
export interface Cookie extends CookieData
```

**Extends:** [CookieData](./puppeteer.cookiedata.md)

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

<span id="expires">expires</span>

</td><td>

</td><td>

number

</td><td>

Cookie expiration date as the number of seconds since the UNIX epoch. Set to `-1` for session cookies

</td><td>

</td></tr>
<tr><td>

<span id="partitionkeyopaque">partitionKeyOpaque</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie partition key is opaque. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

</td><td>

string

</td><td>

Cookie path.

</td><td>

</td></tr>
<tr><td>

<span id="secure">secure</span>

</td><td>

</td><td>

boolean

</td><td>

True if cookie is secure.

</td><td>

</td></tr>
<tr><td>

<span id="session">session</span>

</td><td>

</td><td>

boolean

</td><td>

True in case of session cookie.

</td><td>

</td></tr>
<tr><td>

<span id="size">size</span>

</td><td>

</td><td>

number

</td><td>

Cookie size.

</td><td>

</td></tr>
</tbody></table>
