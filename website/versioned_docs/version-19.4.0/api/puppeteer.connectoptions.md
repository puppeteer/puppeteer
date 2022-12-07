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

| Property                                                              | Modifiers | Type                                                      | Description                                                     | Default |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| [browserURL?](./puppeteer.connectoptions.browserurl.md)               |           | string                                                    | <i>(Optional)</i>                                               |         |
| [browserWSEndpoint?](./puppeteer.connectoptions.browserwsendpoint.md) |           | string                                                    | <i>(Optional)</i>                                               |         |
| [headers?](./puppeteer.connectoptions.headers.md)                     |           | Record&lt;string, string&gt;                              | <i>(Optional)</i> Headers to use for the web socket connection. |         |
| [transport?](./puppeteer.connectoptions.transport.md)                 |           | [ConnectionTransport](./puppeteer.connectiontransport.md) | <i>(Optional)</i>                                               |         |
