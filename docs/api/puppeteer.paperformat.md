---
sidebar_label: PaperFormat
---

# PaperFormat type

All the valid paper format types when printing a PDF.

### Signature

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

- `A0`: 33.1102in x 46.811in

- `A1`: 23.3858in x 33.1102in

- `A2`: 16.5354in x 23.3858in

- `A3`: 11.6929in x 16.5354in

- `A4`: 8.2677in x 11.6929in

- `A5`: 5.8268in x 8.2677in

- `A6`: 4.1339in x 5.8268in
