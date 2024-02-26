---
sidebar_label: ProtocolError
---

# ProtocolError class

ProtocolError is emitted whenever there is an error from the protocol.

#### Signature:

```typescript
export declare class ProtocolError extends PuppeteerError
```

**Extends:** [PuppeteerError](./puppeteer.puppeteererror.md)

## Properties

| Property        | Modifiers             | Type                | Description |
| --------------- | --------------------- | ------------------- | ----------- |
| code            | <code>readonly</code> | number \| undefined |             |
| originalMessage | <code>readonly</code> | string              |             |
