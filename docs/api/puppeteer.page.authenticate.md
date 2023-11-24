---
sidebar_label: Page.authenticate
---

# Page.authenticate() method

Provide credentials for `HTTP authentication`.

#### Signature:

```typescript
class Page &#123;abstract authenticate(credentials: Credentials): Promise<void>;&#125;
```

## Parameters

| Parameter   | Type                                      | Description |
| ----------- | ----------------------------------------- | ----------- |
| credentials | [Credentials](./puppeteer.credentials.md) |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

To disable authentication, pass `null`.
