---
sidebar_label: Page.mainFrame
---

# Page.mainFrame() method

The page's main frame.

#### Signature:

```typescript
class Page {
  abstract mainFrame(): Frame;
}
```

**Returns:**

[Frame](./puppeteer.frame.md)

## Remarks

Page is guaranteed to have a main frame which persists during navigations.
