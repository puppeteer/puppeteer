---
sidebar_label: PaperFormat
---

# PaperFormat type

All the valid paper format types when printing a PDF.

#### Signature:

```typescript
export type PaperFormat =
  | Uppercase<LowerCasePaperFormat>
  | Capitalize<LowerCasePaperFormat>
  | LowerCasePaperFormat;
```

**References:** [LowerCasePaperFormat](./puppeteer.lowercasepaperformat.md)

## Remarks

The sizes of each format are as follows:

- `Letter`: 8.5in x 11in

- `Legal`: 8.5in x 14in

- `Tabloid`: 11in x 17in

- `Ledger`: 17in x 11in

- `A0`: 33.1in x 46.8in

- `A1`: 23.4in x 33.1in

- `A2`: 16.54in x 23.4in

- `A3`: 11.7in x 16.54in

- `A4`: 8.27in x 11.7in

- `A5`: 5.83in x 8.27in

- `A6`: 4.13in x 5.83in
