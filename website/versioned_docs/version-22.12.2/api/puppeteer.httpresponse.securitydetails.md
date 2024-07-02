---
sidebar_label: HTTPResponse.securityDetails
---

# HTTPResponse.securityDetails() method

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.

#### Signature:

```typescript
class HTTPResponse {
  abstract securityDetails(): SecurityDetails | null;
}
```

**Returns:**

[SecurityDetails](./puppeteer.securitydetails.md) \| null
