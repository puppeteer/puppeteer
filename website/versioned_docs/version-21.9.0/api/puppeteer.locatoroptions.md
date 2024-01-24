---
sidebar_label: LocatorOptions
---

# LocatorOptions interface

#### Signature:

```typescript
export interface LocatorOptions
```

## Properties

| Property                     | Modifiers | Type                                                | Description                                                                                                                             | Default                               |
| ---------------------------- | --------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| ensureElementIsInTheViewport |           | boolean                                             | Whether to scroll the element into viewport if not in the viewprot already.                                                             | <code>true</code>                     |
| timeout                      |           | number                                              | <p>Total timeout for the entire locator operation.</p><p>Pass <code>0</code> to disable timeout.</p>                                    | <code>Page.getDefaultTimeout()</code> |
| visibility                   |           | [VisibilityOption](./puppeteer.visibilityoption.md) | Whether to wait for the element to be <code>visible</code> or <code>hidden</code>. <code>null</code> to disable visibility checks.      |                                       |
| waitForEnabled               |           | boolean                                             | Whether to wait for input elements to become enabled before the action. Applicable to <code>click</code> and <code>fill</code> actions. | <code>true</code>                     |
| waitForStableBoundingBox     |           | boolean                                             | Whether to wait for the element's bounding box to be same between two animation frames.                                                 | <code>true</code>                     |
