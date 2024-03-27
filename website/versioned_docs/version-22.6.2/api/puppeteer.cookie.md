---
sidebar_label: Cookie
---

# Cookie interface

Represents a cookie object.

#### Signature:

```typescript
export interface Cookie
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

domain

</td><td>

</td><td>

string

</td><td>

Cookie domain.

</td><td>

</td></tr>
<tr><td>

expires

</td><td>

</td><td>

number

</td><td>

Cookie expiration date as the number of seconds since the UNIX epoch. Set to `-1` for session cookies

</td><td>

</td></tr>
<tr><td>

httpOnly

</td><td>

</td><td>

boolean

</td><td>

True if cookie is http-only.

</td><td>

</td></tr>
<tr><td>

name

</td><td>

</td><td>

string

</td><td>

Cookie name.

</td><td>

</td></tr>
<tr><td>

partitionKey

</td><td>

`optional`

</td><td>

string

</td><td>

Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

partitionKeyOpaque

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie partition key is opaque. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

path

</td><td>

</td><td>

string

</td><td>

Cookie path.

</td><td>

</td></tr>
<tr><td>

priority

</td><td>

`optional`

</td><td>

[CookiePriority](./puppeteer.cookiepriority.md)

</td><td>

Cookie Priority. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

sameParty

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie is SameParty. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

sameSite

</td><td>

`optional`

</td><td>

[CookieSameSite](./puppeteer.cookiesamesite.md)

</td><td>

Cookie SameSite type.

</td><td>

</td></tr>
<tr><td>

secure

</td><td>

</td><td>

boolean

</td><td>

True if cookie is secure.

</td><td>

</td></tr>
<tr><td>

session

</td><td>

</td><td>

boolean

</td><td>

True in case of session cookie.

</td><td>

</td></tr>
<tr><td>

size

</td><td>

</td><td>

number

</td><td>

Cookie size.

</td><td>

</td></tr>
<tr><td>

sourceScheme

</td><td>

`optional`

</td><td>

[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)

</td><td>

Cookie source scheme type. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

value

</td><td>

</td><td>

string

</td><td>

Cookie value.

</td><td>

</td></tr>
</tbody></table>
