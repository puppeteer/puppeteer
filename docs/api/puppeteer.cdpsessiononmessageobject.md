---
sidebar_label: CDPSessionOnMessageObject
---

# CDPSessionOnMessageObject interface

#### Signature:

```typescript
export interface CDPSessionOnMessageObject
```

## Properties

| Property | Modifiers             | Type                                          | Description | Default |
| -------- | --------------------- | --------------------------------------------- | ----------- | ------- |
| error    |                       | { message: string; data: any; code: number; } |             |         |
| id       | <code>optional</code> | number                                        |             |         |
| method   |                       | string                                        |             |         |
| params   |                       | Record&lt;string, unknown&gt;                 |             |         |
| result   | <code>optional</code> | any                                           |             |         |
