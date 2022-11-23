---
sidebar_label: NodeFor
---

# NodeFor type

#### Signature:

```typescript
export declare type NodeFor<ComplexSelector extends string> =
  TypeSelectorOfComplexSelector<ComplexSelector> extends infer TypeSelector
    ? TypeSelector extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[TypeSelector]
      : TypeSelector extends keyof SVGElementTagNameMap
      ? SVGElementTagNameMap[TypeSelector]
      : Element
    : never;
```
