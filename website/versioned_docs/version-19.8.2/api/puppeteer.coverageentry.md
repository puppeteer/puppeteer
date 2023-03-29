---
sidebar_label: CoverageEntry
---

# CoverageEntry interface

The CoverageEntry class represents one entry of the coverage report.

#### Signature:

```typescript
export interface CoverageEntry
```

## Properties

| Property | Modifiers | Type                                         | Description                                   | Default |
| -------- | --------- | -------------------------------------------- | --------------------------------------------- | ------- |
| ranges   |           | Array&lt;{ start: number; end: number; }&gt; | The covered range as start and end positions. |         |
| text     |           | string                                       | The content of the style sheet or script.     |         |
| url      |           | string                                       | The URL of the style sheet or script.         |         |
