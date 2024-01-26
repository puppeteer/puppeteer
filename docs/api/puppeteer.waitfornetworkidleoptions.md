---
sidebar_label: WaitForNetworkIdleOptions
---

# WaitForNetworkIdleOptions interface

#### Signature:

```typescript
export interface WaitForNetworkIdleOptions extends WaitTimeoutOptions
```

**Extends:** [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

## Properties

| Property    | Modifiers             | Type   | Description                                                                 | Default          |
| ----------- | --------------------- | ------ | --------------------------------------------------------------------------- | ---------------- |
| concurrency | <code>optional</code> | number | Maximum number concurrent of network connections to be considered inactive. | <code>0</code>   |
| idleTime    | <code>optional</code> | number | Time (in milliseconds) the network should be idle.                          | <code>500</code> |
