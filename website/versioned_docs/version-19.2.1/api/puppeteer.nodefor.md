---
sidebar_label: NodeFor
---

# NodeFor type

#### Signature:

```typescript
export declare type NodeFor<Selector extends string> =
  Selector extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[Selector]
    : Selector extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[Selector]
    : Element;
```
