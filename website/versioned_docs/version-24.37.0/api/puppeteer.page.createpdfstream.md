---
sidebar_label: Page.createPDFStream
---

# Page.createPDFStream() method

Generates a PDF of the page with the `print` CSS media type.

### Signature

```typescript
class Page {
  abstract createPDFStream(
    options?: PDFOptions,
  ): Promise<ReadableStream<Uint8Array>>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

[PDFOptions](./puppeteer.pdfoptions.md)

</td><td>

_(Optional)_ options for generating the PDF.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;ReadableStream&lt;Uint8Array&gt;&gt;

## Remarks

To generate a PDF with the `screen` media type, call [\`page.emulateMediaType('screen')\`](./puppeteer.page.emulatemediatype.md) before calling `page.pdf()`.

By default, `page.pdf()` generates a pdf with modified colors for printing. Use the [\`-webkit-print-color-adjust\`](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust) property to force rendering of exact colors.
