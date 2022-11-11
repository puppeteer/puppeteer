---
sidebar_label: Page.mainFrame
---

# Page.mainFrame() method

#### Signature:

```typescript
class Page {
  mainFrame(): Frame;
}
```

**Returns:**

[Frame](./puppeteer.frame.md)

The page's main frame.

## Remarks

Page is guaranteed to have a main frame which persists during navigations.
