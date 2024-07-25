---
sidebar_label: JSHandle.evaluate
---

# JSHandle.evaluate() method

Evaluates the given function with the current handle as its first argument.

### Signature

```typescript
class JSHandle {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>,
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
