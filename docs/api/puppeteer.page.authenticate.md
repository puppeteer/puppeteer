---
sidebar_label: Page.authenticate
---

# Page.authenticate() method

Provide credentials for `HTTP authentication`.

#### Signature:

```typescript
class Page {
  abstract authenticate(credentials: Credentials): Promise<void>;
}
```

## Parameters

| Parameter   | Type                                      | Description |
| ----------- | ----------------------------------------- | ----------- |
| credentials | [Credentials](./puppeteer.credentials.md) |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

To disable authentication, pass `null`.

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
