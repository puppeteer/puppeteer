---
sidebar_label: Page.pdf
---

# Page.pdf() method

Generates a PDF of the page with the `print` CSS media type.

#### Signature:

```typescript
class Page {
  abstract pdf(options?: PDFOptions): Promise<Buffer>;
}
```

## Parameters

| Parameter | Type                                    | Description                                  |
| --------- | --------------------------------------- | -------------------------------------------- |
| options   | [PDFOptions](./puppeteer.pdfoptions.md) | _(Optional)_ options for generating the PDF. |

**Returns:**

Promise&lt;Buffer&gt;

## Remarks

To generate a PDF with the `screen` media type, call [\`page.emulateMediaType('screen')\`](./puppeteer.page.emulatemediatype.md) before calling `page.pdf()`.

By default, `page.pdf()` generates a pdf with modified colors for printing. Use the [\`-webkit-print-color-adjust\`](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust) property to force rendering of exact colors.
