---
sidebar_label: NodeFor
---

# NodeFor type

#### Signature:

```typescript
export type NodeFor<ComplexSelector extends string> =
  TypeSelectorOfComplexSelector<ComplexSelector> extends infer TypeSelector
    ? TypeSelector extends
        | keyof HTMLElementTagNameMap
        | keyof SVGElementTagNameMap
      ? ElementFor<TypeSelector>
      : Element
    : never;
```

**References:** [ElementFor](./puppeteer.elementfor.md)
