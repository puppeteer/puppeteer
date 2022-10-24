---
sidebar_label: HTTPResponse.securityDetails
---

# HTTPResponse.securityDetails() method

**Signature:**

```typescript
class HTTPResponse {
  securityDetails(): SecurityDetails | null;
}
```

**Returns:**

[SecurityDetails](./puppeteer.securitydetails.md) \| null

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.
