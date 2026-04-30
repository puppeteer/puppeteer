---
sidebar_label: Locator.setTimeout
---

# Locator.setTimeout() method

Creates a new locator instance by cloning the current locator and setting the total timeout for the locator actions.

Pass `0` to disable timeout.

### Signature

```typescript
class Locator {
  setTimeout(timeout: number): Locator<T>;
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

timeout

</td><td>

number

</td><td>

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;T&gt;

#### Default value:

`Page.getDefaultTimeout()`
