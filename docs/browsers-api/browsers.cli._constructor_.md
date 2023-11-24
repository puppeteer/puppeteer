---
sidebar_label: CLI.(constructor)
---

# CLI.(constructor)

Constructs a new instance of the `CLI` class

#### Signature:

```typescript
class CLI &#123;constructor(opts?: string | &#123;
        cachePath?: string;
        scriptName?: string;
        prefixCommand?: &#123;
            cmd: string;
            description: string;
        &#125;;
        allowCachePathOverride?: boolean;
        pinnedBrowsers?: Partial<&#123;
            [key in Browser]: string;
        &#125;>;
    &#125;, rl?: readline.Interface);&#125;
```

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                    | Description  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| opts      | string \| &#123; cachePath?: string; scriptName?: string; prefixCommand?: &#123; cmd: string; description: string; &#125;; allowCachePathOverride?: boolean; pinnedBrowsers?: Partial&lt;&#123; \[key in [Browser](./browsers.browser.md)\]: string; &#125;&gt;; &#125; | _(Optional)_ |
| rl        | readline.Interface                                                                                                                                                                                                                                                      | _(Optional)_ |
