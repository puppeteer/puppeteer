---
sidebar_label: Frame.evaluate
---

# Frame.evaluate() method

Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the context of this frame.

See [Page.evaluate()](./puppeteer.page.evaluate.md) for details.

### Signature

```typescript
class Frame {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
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

pageFunction

</td><td>

Func \| string

</td><td>

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;
