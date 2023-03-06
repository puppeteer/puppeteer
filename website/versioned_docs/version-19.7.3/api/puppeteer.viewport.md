---
sidebar_label: Viewport
---

# Viewport interface

Sets the viewport of the page.

#### Signature:

```typescript
export interface Viewport
```

## Properties

| Property                                                        | Modifiers | Type    | Description                                                                                                                                               | Default |
| --------------------------------------------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| [deviceScaleFactor?](./puppeteer.viewport.devicescalefactor.md) |           | number  | _(Optional)_ Specify device scale factor. See [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) for more info. | 1       |
| [hasTouch?](./puppeteer.viewport.hastouch.md)                   |           | boolean | _(Optional)_ Specify if the viewport supports touch events.                                                                                               | false   |
| [height](./puppeteer.viewport.height.md)                        |           | number  | The page height in pixels.                                                                                                                                |         |
| [isLandscape?](./puppeteer.viewport.islandscape.md)             |           | boolean | _(Optional)_ Specifies if the viewport is in landscape mode.                                                                                              | false   |
| [isMobile?](./puppeteer.viewport.ismobile.md)                   |           | boolean | _(Optional)_ Whether the <code>meta viewport</code> tag is taken into account.                                                                            | false   |
| [width](./puppeteer.viewport.width.md)                          |           | number  | The page width in pixels.                                                                                                                                 |         |
