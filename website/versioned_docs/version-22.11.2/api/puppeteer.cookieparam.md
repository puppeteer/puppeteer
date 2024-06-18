---
sidebar_label: CookieParam
---

# CookieParam interface

Cookie parameter object

#### Signature:

```typescript
export interface CookieParam
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

`optional`

</td><td>

string

</td><td>

Cookie domain.

</td><td>

</td></tr>
<tr><td>

<span id="expires">expires</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Cookie expiration date, session cookie if not set

</td><td>

</td></tr>
<tr><td>

<span id="httponly">httpOnly</span>

</td><td>

`optional`

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

Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. If not set, the cookie will be set as not partitioned.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

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

`optional`

</td><td>

boolean

</td><td>

True if cookie is secure.

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

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The request-URI to associate with the setting of the cookie. This value can affect the default domain, path, and source scheme values of the created cookie.

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
