---
sidebar_label: Frame.locator_1
---

# Frame.locator() method

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

#### Signature:

```typescript
class Frame {
  locator<Ret>(func: () => Awaitable<Ret>): Locator<Ret>;
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

func

</td><td>

() =&gt; [Awaitable](./puppeteer.awaitable.md)&lt;Ret&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;Ret&gt;
