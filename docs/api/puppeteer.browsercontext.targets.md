---
sidebar_label: BrowserContext.targets
---

# BrowserContext.targets() method

Gets all active [targets](./puppeteer.target.md) inside this [browser context](./puppeteer.browsercontext.md), plus targets for discarded tabs when [TargetOptions.includeDiscarded](./puppeteer.targetoptions.md#includediscarded) is `true`.

### Signature

```typescript
class BrowserContext {
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
