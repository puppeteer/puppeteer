---
sidebar_label: PDFOptions.headerTemplate
---

# PDFOptions.headerTemplate property

HTML template for the print header. Should be valid HTML with the following classes used to inject values into them: - `date` formatted print date

- `title` document title

- `url` document location

- `pageNumber` current page number

- `totalPages` total pages in the document

**Signature:**

```typescript
interface PDFOptions {
  headerTemplate?: string;
}
```
