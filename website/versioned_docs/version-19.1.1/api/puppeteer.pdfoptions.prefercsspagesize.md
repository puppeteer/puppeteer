---
sidebar_label: PDFOptions.preferCSSPageSize
---

# PDFOptions.preferCSSPageSize property

Give any CSS `@page` size declared in the page priority over what is declared in the `width` or `height` or `format` option.

#### Signature:

```typescript
interface PDFOptions {
  preferCSSPageSize?: boolean;
}
```

#### Default value:

`false`, which will scale the content to fit the paper size.
