---
sidebar_label: GoToOptions
---

# GoToOptions interface

#### Signature:

```typescript
export interface GoToOptions extends WaitForOptions
```

**Extends:** [WaitForOptions](./puppeteer.waitforoptions.md)

## Properties

| Property       | Modifiers             | Type   | Description                                                                                                                                             | Default |
| -------------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| referer        | <code>optional</code> | string | If provided, it will take preference over the referer header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md).        |         |
| referrerPolicy | <code>optional</code> | string | If provided, it will take preference over the referer-policy header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md). |         |
