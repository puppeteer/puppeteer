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

| Property     | Modifiers             | Type                                                    | Description                                                                                                                                                                                          | Default |
| ------------ | --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| domain       | <code>optional</code> | string                                                  | Cookie domain.                                                                                                                                                                                       |         |
| expires      | <code>optional</code> | number                                                  | Cookie expiration date, session cookie if not set                                                                                                                                                    |         |
| httpOnly     | <code>optional</code> | boolean                                                 | True if cookie is http-only.                                                                                                                                                                         |         |
| name         |                       | string                                                  | Cookie name.                                                                                                                                                                                         |         |
| partitionKey | <code>optional</code> | string                                                  | Cookie partition key. The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie. If not set, the cookie will be set as not partitioned. |         |
| path         | <code>optional</code> | string                                                  | Cookie path.                                                                                                                                                                                         |         |
| priority     | <code>optional</code> | [CookiePriority](./puppeteer.cookiepriority.md)         | Cookie Priority. Supported only in Chrome.                                                                                                                                                           |         |
| sameParty    | <code>optional</code> | boolean                                                 | True if cookie is SameParty. Supported only in Chrome.                                                                                                                                               |         |
| sameSite     | <code>optional</code> | [CookieSameSite](./puppeteer.cookiesamesite.md)         | Cookie SameSite type.                                                                                                                                                                                |         |
| secure       | <code>optional</code> | boolean                                                 | True if cookie is secure.                                                                                                                                                                            |         |
| sourceScheme | <code>optional</code> | [CookieSourceScheme](./puppeteer.cookiesourcescheme.md) | Cookie source scheme type. Supported only in Chrome.                                                                                                                                                 |         |
| url          | <code>optional</code> | string                                                  | The request-URI to associate with the setting of the cookie. This value can affect the default domain, path, and source scheme values of the created cookie.                                         |         |
| value        |                       | string                                                  | Cookie value.                                                                                                                                                                                        |         |
