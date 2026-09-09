---
sidebar_label: CookieSourceScheme
---

# CookieSourceScheme type

Represents the source scheme of the origin that originally set the cookie. A value of "Unset" allows protocol clients to emulate legacy cookie scope for the scheme. This is a temporary ability and it will be removed in the future.

### Signature

```typescript
export type CookieSourceScheme = 'Unset' | 'NonSecure' | 'Secure';
```
