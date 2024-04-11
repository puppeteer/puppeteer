---
sidebar_label: CDPEvents
---

# CDPEvents type

#### Signature:

```typescript
export type CDPEvents = {
  [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
};
```
