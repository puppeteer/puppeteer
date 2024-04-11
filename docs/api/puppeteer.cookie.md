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

<p id="domain">domain</p>

</td><td>

</td><td>

string

</td><td>

Cookie domain.

</td><td>

</td></tr>
<tr><td>

<p id="expires">expires</p>

</td><td>

</td><td>

number

</td><td>

Cookie expiration date as the number of seconds since the UNIX epoch. Set to `-1` for session cookies

</td><td>

</td></tr>
<tr><td>

<p id="httponly">httpOnly</p>

</td><td>

</td><td>

boolean

</td><td>

True if cookie is http-only.

</td><td>

</td></tr>
<tr><td>

<p id="name">name</p>

</td><td>

</td><td>

string

</td><td>

Cookie name.

</td><td>

</td></tr>
<tr><td>

<p id="partitionkey">partitionKey</p>

</td><td>

`optional`

</td><td>

string

</td><td>

Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<p id="partitionkeyopaque">partitionKeyOpaque</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie partition key is opaque. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<p id="path">path</p>

</td><td>

</td><td>

string

</td><td>

Cookie path.

</td><td>

</td></tr>
<tr><td>

<p id="priority">priority</p>

</td><td>

`optional`

</td><td>

[CookiePriority](./puppeteer.cookiepriority.md)

</td><td>

Cookie Priority. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<p id="sameparty">sameParty</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie is SameParty. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<p id="samesite">sameSite</p>

</td><td>

`optional`

</td><td>

[CookieSameSite](./puppeteer.cookiesamesite.md)

</td><td>

Cookie SameSite type.

</td><td>

</td></tr>
<tr><td>

<p id="secure">secure</p>

</td><td>

</td><td>

boolean

</td><td>

True if cookie is secure.

</td><td>

</td></tr>
<tr><td>

<p id="session">session</p>

</td><td>

</td><td>

boolean

</td><td>

True in case of session cookie.

</td><td>

</td></tr>
<tr><td>

<p id="size">size</p>

</td><td>

</td><td>

number

</td><td>

Cookie size.

</td><td>

</td></tr>
<tr><td>

<p id="sourcescheme">sourceScheme</p>

</td><td>

`optional`

</td><td>

[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)

</td><td>

Cookie source scheme type. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<p id="value">value</p>

</td><td>

</td><td>

string

</td><td>

Cookie value.

</td><td>

</td></tr>
</tbody></table>
