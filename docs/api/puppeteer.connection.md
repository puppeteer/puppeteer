---
sidebar_label: Connection
---

# Connection class

#### Signature:

```typescript
export declare class Connection extends EventEmitter
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)

## Constructors

| Constructor                                                                              | Modifiers | Description                                                    |
| ---------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| [(constructor)(url, transport, delay, timeout)](./puppeteer.connection._constructor_.md) |           | Constructs a new instance of the <code>Connection</code> class |

## Properties

| Property | Modifiers             | Type   | Description |
| -------- | --------------------- | ------ | ----------- |
| timeout  | <code>readonly</code> | number |             |

## Methods

| Method                                                               | Modifiers           | Description |
| -------------------------------------------------------------------- | ------------------- | ----------- |
| [createSession(targetInfo)](./puppeteer.connection.createsession.md) |                     |             |
| [dispose()](./puppeteer.connection.dispose.md)                       |                     |             |
| [fromSession(session)](./puppeteer.connection.fromsession.md)        | <code>static</code> |             |
| [send(method, paramArgs)](./puppeteer.connection.send.md)            |                     |             |
| [session(sessionId)](./puppeteer.connection.session.md)              |                     |             |
| [url()](./puppeteer.connection.url.md)                               |                     |             |
