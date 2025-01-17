---
sidebar_label: CDPEvents
---

# CDPEvents type

### Signature

```typescript
export declare type CDPEvents = {
  [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
};
```
