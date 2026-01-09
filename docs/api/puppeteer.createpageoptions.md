---
sidebar_label: CreatePageOptions
---

# CreatePageOptions type

### Signature

```typescript
export type CreatePageOptions = (
  | {
      type?: 'tab';
    }
  | {
      type: 'window';
      windowBounds?: WindowBounds;
    }
) & {
  background?: boolean;
};
```

**References:** [WindowBounds](./puppeteer.windowbounds.md)
