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

<span id="domain">domain</span>

</td><td>

</td><td>

string

</td><td>

Cookie domain.

</td><td>

</td></tr>
<tr><td>

<span id="expires">expires</span>

</td><td>

</td><td>

number

</td><td>

Cookie expiration date as the number of seconds since the UNIX epoch. Set to `-1` for session cookies

</td><td>

</td></tr>
<tr><td>

<span id="httponly">httpOnly</span>

</td><td>

</td><td>

boolean

</td><td>

True if cookie is http-only.

</td><td>

</td></tr>
<tr><td>

<span id="name">name</span>

</td><td>

</td><td>

string

</td><td>

Cookie name.

</td><td>

</td></tr>
<tr><td>

<span id="partitionkey">partitionKey</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. Supported only in Chrome.

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

<span id="priority">priority</span>

</td><td>

`optional`

</td><td>

[CookiePriority](./puppeteer.cookiepriority.md)

</td><td>

Cookie Priority. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<span id="sameparty">sameParty</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

True if cookie is SameParty. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<span id="samesite">sameSite</span>

</td><td>

`optional`

</td><td>

[CookieSameSite](./puppeteer.cookiesamesite.md)

</td><td>

Cookie SameSite type.

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
<tr><td>

<span id="sourcescheme">sourceScheme</span>

</td><td>

`optional`

</td><td>

[CookieSourceScheme](./puppeteer.cookiesourcescheme.md)

</td><td>

Cookie source scheme type. Supported only in Chrome.

</td><td>

</td></tr>
<tr><td>

<span id="value">value</span>

</td><td>

</td><td>

string

</td><td>

Cookie value.

</td><td>

</td></tr>
</tbody></table>
