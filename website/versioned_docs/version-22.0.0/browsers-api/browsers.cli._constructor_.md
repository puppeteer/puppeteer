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

| Parameter | Type                                                                                                                                                                                                                                                                    | Description  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| opts      | string \| &#123; cachePath?: string; scriptName?: string; prefixCommand?: &#123; cmd: string; description: string; &#125;; allowCachePathOverride?: boolean; pinnedBrowsers?: Partial&lt;&#123; \[key in [Browser](./browsers.browser.md)\]: string; &#125;&gt;; &#125; | _(Optional)_ |
| rl        | readline.Interface                                                                                                                                                                                                                                                      | _(Optional)_ |
