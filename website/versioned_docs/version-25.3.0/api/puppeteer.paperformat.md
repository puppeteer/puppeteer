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

- `Letter`: 8.5in x 11in / 21.59cm x 27.94cm

- `Legal`: 8.5in x 14in / 21.59cm x 35.56cm

- `Tabloid`: 11in x 17in / 27.94cm x 43.18cm

- `Ledger`: 17in x 11in / 43.18cm x 27.94cm

- `A0`: 33.1102in x 46.811in / 84.1cm x 118.9cm

- `A1`: 23.3858in x 33.1102in / 59.4cm x 84.1cm

- `A2`: 16.5354in x 23.3858in / 42cm x 59.4cm

- `A3`: 11.6929in x 16.5354in / 29.7cm x 42cm

- `A4`: 8.2677in x 11.6929in / 21cm x 29.7cm

- `A5`: 5.8268in x 8.2677in / 14.8cm x 21cm

- `A6`: 4.1339in x 5.8268in / 10.5cm x 14.8cm
