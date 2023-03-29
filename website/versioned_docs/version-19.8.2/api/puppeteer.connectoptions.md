---
sidebar_label: ConnectOptions
---

# ConnectOptions interface

#### Signature:

```typescript
export interface ConnectOptions extends BrowserConnectOptions
```

**Extends:** [BrowserConnectOptions](./puppeteer.browserconnectoptions.md)

## Properties

| Property          | Modifiers             | Type                                                      | Description                                   | Default |
| ----------------- | --------------------- | --------------------------------------------------------- | --------------------------------------------- | ------- |
| browserURL        | <code>optional</code> | string                                                    |                                               |         |
| browserWSEndpoint | <code>optional</code> | string                                                    |                                               |         |
| headers           | <code>optional</code> | Record&lt;string, string&gt;                              | Headers to use for the web socket connection. |         |
| transport         | <code>optional</code> | [ConnectionTransport](./puppeteer.connectiontransport.md) |                                               |         |
