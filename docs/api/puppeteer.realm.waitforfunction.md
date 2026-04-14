---
sidebar_label: Realm.waitForFunction
---

# Realm.waitForFunction() method

### Signature

```typescript
class Realm {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    options?: {
      polling?: 'raf' | 'mutation' | number;
      timeout?: number;
      root?: ElementHandle<Node>;
      signal?: AbortSignal;
    },
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

options

</td><td>

&#123; polling?: 'raf' \| 'mutation' \| number; timeout?: number; root?: [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;; signal?: AbortSignal; &#125;

</td><td>

_(Optional)_

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
