---
sidebar_label: BrowserContextOptions
---

# BrowserContextOptions interface

BrowserContext options.

#### Signature:

```typescript
export interface BrowserContextOptions
```

## Properties

| Property        | Modifiers             | Type       | Description                                                                                                                  | Default |
| --------------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| proxyBypassList | <code>optional</code> | string\[\] | Bypass the proxy for the given list of hosts.                                                                                |         |
| proxyServer     | <code>optional</code> | string     | Proxy server with optional port to use for all requests. Username and password can be set in <code>Page.authenticate</code>. |         |
