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

| Parameter | Type                                                                                 | Description  |
| --------- | ------------------------------------------------------------------------------------ | ------------ |
| options   | [ScreenshotOptions](./puppeteer.screenshotoptions.md) &amp; { encoding?: 'binary'; } | _(Optional)_ |

**Returns:**

Promise&lt;Buffer&gt;
