---
sidebar_label: CLI.(constructor)
---

# CLI.(constructor)

Constructs a new instance of the `CLI` class

#### Signature:

```typescript
class CLI {
  constructor(
    opts?:
      | string
      | {
          cachePath?: string;
          scriptName?: string;
          prefixCommand?: {
            cmd: string;
            description: string;
          };
          allowCachePathOverride?: boolean;
          pinnedBrowsers?: Partial<{
            [key in Browser]: string;
          }>;
        },
    rl?: readline.Interface
  );
}
```

## Parameters

| Parameter | Type                                                                                                                                                                                                                                      | Description  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| opts      | string \| { cachePath?: string; scriptName?: string; prefixCommand?: { cmd: string; description: string; }; allowCachePathOverride?: boolean; pinnedBrowsers?: Partial&lt;{ \[key in [Browser](./browsers.browser.md)\]: string; }&gt;; } | _(Optional)_ |
| rl        | readline.Interface                                                                                                                                                                                                                        | _(Optional)_ |
