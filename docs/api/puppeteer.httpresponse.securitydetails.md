---
sidebar_label: HTTPResponse.securityDetails
---

# HTTPResponse.securityDetails() method

### Signature:

```typescript
class HTTPResponse {
  abstract securityDetails(): SecurityDetails | null;
}
```

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.

**Returns:**

[SecurityDetails](./puppeteer.securitydetails.md) \| null
