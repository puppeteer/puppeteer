---
sidebar_label: Frame.evaluateHandle
---

# Frame.evaluateHandle() method

Behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of this frame.

See [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) for details.

### Signature

```typescript
class Frame {
  evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
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

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;
