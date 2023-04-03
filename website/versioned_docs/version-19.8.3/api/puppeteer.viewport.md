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

| Property          | Modifiers             | Type    | Description                                                                                                                                  | Default            |
| ----------------- | --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| deviceScaleFactor | <code>optional</code> | number  | Specify device scale factor. See [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) for more info. | <code>1</code>     |
| hasTouch          | <code>optional</code> | boolean | Specify if the viewport supports touch events.                                                                                               | <code>false</code> |
| height            |                       | number  | The page height in pixels.                                                                                                                   |                    |
| isLandscape       | <code>optional</code> | boolean | Specifies if the viewport is in landscape mode.                                                                                              | <code>false</code> |
| isMobile          | <code>optional</code> | boolean | Whether the <code>meta viewport</code> tag is taken into account.                                                                            | <code>false</code> |
| width             |                       | number  | The page width in pixels.                                                                                                                    |                    |
