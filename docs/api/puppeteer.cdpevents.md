---
sidebar_label: CDPEvents
---

# CDPEvents type

#### Signature:

```typescript
export type CDPEvents = &#123;
    [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
&#125;;
```
