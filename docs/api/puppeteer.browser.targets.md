---
sidebar_label: Browser.targets
---

# Browser.targets() method

Gets all active [targets](./puppeteer.target.md), plus targets for discarded tabs when [TargetOptions.includeDiscarded](./puppeteer.targetoptions.md#includediscarded) is `true`.

In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all matching [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  abstract targets(options?: TargetOptions): Target[];
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

options

</td><td>

[TargetOptions](./puppeteer.targetoptions.md)

</td><td>

_(Optional)_ Options to filter the returned targets.

</td></tr>
</tbody></table>

**Returns:**

[Target](./puppeteer.target.md)\[\]
