---
sidebar_label: Page.viewport
---

# Page.viewport() method

Current page viewport settings.

#### Signature:

```typescript
class Page {
  viewport(): Viewport | null;
}
```

**Returns:**

[Viewport](./puppeteer.viewport.md) \| null

- `width`: page's width in pixels

- `height`: page's height in pixels

- `deviceScaleFactor`: Specify device scale factor (can be though of as dpr). Defaults to `1`.

- `isMobile`: Whether the meta viewport tag is taken into account. Defaults to `false`.

- `hasTouch`: Specifies if viewport supports touch events. Defaults to `false`.

- `isLandScape`: Specifies if viewport is in landscape mode. Defaults to `false`.
