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

| Property                                                        | Modifiers | Type    | Description                                                                                                                                                    | Default |
| --------------------------------------------------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| [deviceScaleFactor?](./puppeteer.viewport.devicescalefactor.md) |           | number  | <i>(Optional)</i> Specify device scale factor. See [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) for more info. | 1       |
| [hasTouch?](./puppeteer.viewport.hastouch.md)                   |           | boolean | <i>(Optional)</i> Specify if the viewport supports touch events.                                                                                               | false   |
| [height](./puppeteer.viewport.height.md)                        |           | number  | The page height in pixels.                                                                                                                                     |         |
| [isLandscape?](./puppeteer.viewport.islandscape.md)             |           | boolean | <i>(Optional)</i> Specifies if the viewport is in landscape mode.                                                                                              | false   |
| [isMobile?](./puppeteer.viewport.ismobile.md)                   |           | boolean | <i>(Optional)</i> Whether the <code>meta viewport</code> tag is taken into account.                                                                            | false   |
| [width](./puppeteer.viewport.width.md)                          |           | number  | The page width in pixels.                                                                                                                                      |         |
