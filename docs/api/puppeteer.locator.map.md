---
sidebar_label: Locator.map
---

# Locator.map() method

Maps the locator using the provided mapper.

### Signature

```typescript
class Locator {
  map<To, Args extends unknown[] = []>(
    mapper: Mapper<T, To, Args>,
    ...args: Args
  ): Locator<To>;
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

mapper

</td><td>

[Mapper](./puppeteer.mapper.md)&lt;T, To, Args&gt;

</td><td>

</td></tr>
<tr><td>

args

</td><td>

Args

</td><td>

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;To&gt;
