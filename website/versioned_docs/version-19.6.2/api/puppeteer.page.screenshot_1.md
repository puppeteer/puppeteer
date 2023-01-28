---
sidebar_label: Page.screenshot_1
---

# Page.screenshot() method

#### Signature:

```typescript
class Page {
  screenshot(
    options?: ScreenshotOptions & {
      encoding?: 'binary';
    }
  ): Promise<Buffer>;
}
```

## Parameters

| Parameter | Type                                                                                 | Description       |
| --------- | ------------------------------------------------------------------------------------ | ----------------- |
| options   | [ScreenshotOptions](./puppeteer.screenshotoptions.md) &amp; { encoding?: 'binary'; } | <i>(Optional)</i> |

**Returns:**

Promise&lt;Buffer&gt;
