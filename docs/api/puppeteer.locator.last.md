---
sidebar_label: Locator.last
---

# Locator.last() method

Waits for multiple locators to locate elements in DOM and calls the action on the last locator waiting for action-specific preconditions. If any of the elements identified by locators is not found, the last locator times out.

#### Signature:

```typescript
class Locator {
  static last<Locators extends readonly unknown[] | []>(
    locators: Locators
  ): Locator<AwaitedLocator<Locators[number]>>;
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

locators

</td><td>

Locators

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;[AwaitedLocator](./puppeteer.awaitedlocator.md)&lt;Locators\[number\]&gt;&gt;

## Example

```ts
await Locator.last([
  page.locator('#locator1'),
  page.locator('#locator2'),
]).wait();
await page.locator('#locator3').click();
```
