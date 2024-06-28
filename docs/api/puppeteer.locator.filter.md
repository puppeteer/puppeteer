---
sidebar_label: Locator.filter
---

# Locator.filter() method

### Signature:

```typescript
class Locator {
  filter<S extends T>(predicate: Predicate<T, S>): Locator<S>;
}
```

Creates an expectation that is evaluated against located values.

If the expectations do not match, then the locator will retry.

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

predicate

</td><td>

[Predicate](./puppeteer.predicate.md)&lt;T, S&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;S&gt;
