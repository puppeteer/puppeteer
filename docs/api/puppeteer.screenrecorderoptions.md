---
sidebar_label: ScreenRecorderOptions
---

# ScreenRecorderOptions interface

#### Signature:

```typescript
export interface ScreenRecorderOptions
```

## Properties

| Property | Modifiers             | Type                                      | Description                                                                                                                                                                                            | Default        |
| -------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| crop     | <code>optional</code> | [BoundingBox](./puppeteer.boundingbox.md) | Specifies the region of the viewport to crop.                                                                                                                                                          |                |
| scale    | <code>optional</code> | number                                    | <p>Scales the output video.</p><p>For example, <code>0.5</code> will shrink the width and height of the output video by half. <code>2</code> will double the width and height of the output video.</p> | <code>1</code> |
| speed    | <code>optional</code> | number                                    | <p>Specifies the speed to record at.</p><p>For example, <code>0.5</code> will slowdown the output video by 50%. <code>2</code> will double the speed of the output video.</p>                          | <code>1</code> |
