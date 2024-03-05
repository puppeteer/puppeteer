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

| Property           | Modifiers             | Type                                                    | Description                                                                                                                                                             | Default |
| ------------------ | --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| domain             |                       | string                                                  | Cookie domain.                                                                                                                                                          |         |
| expires            |                       | number                                                  | Cookie expiration date as the number of seconds since the UNIX epoch. Set to <code>-1</code> for session cookies                                                        |         |
| httpOnly           |                       | boolean                                                 | True if cookie is http-only.                                                                                                                                            |         |
| name               |                       | string                                                  | Cookie name.                                                                                                                                                            |         |
| partitionKey       | <code>optional</code> | string                                                  | Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. Supported only in Chrome. |         |
| partitionKeyOpaque | <code>optional</code> | boolean                                                 | True if cookie partition key is opaque. Supported only in Chrome.                                                                                                       |         |
| path               |                       | string                                                  | Cookie path.                                                                                                                                                            |         |
| priority           | <code>optional</code> | [CookiePriority](./puppeteer.cookiepriority.md)         | Cookie Priority. Supported only in Chrome.                                                                                                                              |         |
| sameParty          | <code>optional</code> | boolean                                                 | True if cookie is SameParty. Supported only in Chrome.                                                                                                                  |         |
| sameSite           | <code>optional</code> | [CookieSameSite](./puppeteer.cookiesamesite.md)         | Cookie SameSite type.                                                                                                                                                   |         |
| secure             |                       | boolean                                                 | True if cookie is secure.                                                                                                                                               |         |
| session            |                       | boolean                                                 | True in case of session cookie.                                                                                                                                         |         |
| size               |                       | number                                                  | Cookie size.                                                                                                                                                            |         |
| sourceScheme       | <code>optional</code> | [CookieSourceScheme](./puppeteer.cookiesourcescheme.md) | Cookie source scheme type. Supported only in Chrome.                                                                                                                    |         |
| value              |                       | string                                                  | Cookie value.                                                                                                                                                           |         |
