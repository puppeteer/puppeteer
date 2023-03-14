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

| Property                                                              | Modifiers | Type                                                      | Description                                                | Default |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------------- | ---------------------------------------------------------- | ------- |
| [browserURL?](./puppeteer.connectoptions.browserurl.md)               |           | string                                                    | _(Optional)_                                               |         |
| [browserWSEndpoint?](./puppeteer.connectoptions.browserwsendpoint.md) |           | string                                                    | _(Optional)_                                               |         |
| [headers?](./puppeteer.connectoptions.headers.md)                     |           | Record&lt;string, string&gt;                              | _(Optional)_ Headers to use for the web socket connection. |         |
| [transport?](./puppeteer.connectoptions.transport.md)                 |           | [ConnectionTransport](./puppeteer.connectiontransport.md) | _(Optional)_                                               |         |
