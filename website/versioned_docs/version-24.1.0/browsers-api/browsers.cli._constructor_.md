---
sidebar_label: CLI.(constructor)
---

# CLI.(constructor)

Constructs a new instance of the `CLI` class

### Signature

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
          pinnedBrowsers?: Partial<
            Record<
              Browser,
              {
                buildId: string;
                skipDownload: boolean;
              }
            >
          >;
        },
    rl?: readline.Interface,
  );
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

opts

</td><td>

string \| &#123; cachePath?: string; scriptName?: string; prefixCommand?: &#123; cmd: string; description: string; &#125;; allowCachePathOverride?: boolean; pinnedBrowsers?: Partial&lt;Record&lt;[Browser](./browsers.browser.md), &#123; buildId: string; skipDownload: boolean; &#125;&gt;&gt;; &#125;

</td><td>

_(Optional)_

</td></tr>
<tr><td>

rl

</td><td>

readline.Interface

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
