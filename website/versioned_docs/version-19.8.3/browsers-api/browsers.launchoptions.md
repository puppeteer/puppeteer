---
sidebar_label: LaunchOptions
---

# LaunchOptions type

#### Signature:

```typescript
export type LaunchOptions = {
  executablePath: string;
  pipe?: boolean;
  dumpio?: boolean;
  args?: string[];
  env?: Record<string, string | undefined>;
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  detached?: boolean;
  onExit?: () => Promise<void>;
};
```
