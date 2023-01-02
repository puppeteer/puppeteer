---
sidebar_label: PDFOptions.path
---

# PDFOptions.path property

The path to save the file to.

#### Signature:

```typescript
interface PDFOptions {
  path?: string;
}
```

#### Default value:

the empty string, which means the PDF will not be written to disk.

## Remarks

If the path is relative, it's resolved relative to the current working directory.
