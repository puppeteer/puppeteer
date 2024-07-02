---
sidebar_label: ElementFor
---

# ElementFor type

#### Signature:

```typescript
export type ElementFor<
  TagName extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap,
> = TagName extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TagName]
  : TagName extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TagName]
    : never;
```
