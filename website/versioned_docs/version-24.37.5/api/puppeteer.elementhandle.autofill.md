---
sidebar_label: ElementHandle.autofill
---

# ElementHandle.autofill() method

If the element is a form input, you can use [ElementHandle.autofill()](./puppeteer.elementhandle.autofill.md) to test if the form is compatible with the browser's autofill implementation. Throws an error if the form cannot be autofilled.

### Signature

```typescript
class ElementHandle {
  abstract autofill(data: AutofillData): Promise<void>;
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

data

</td><td>

[AutofillData](./puppeteer.autofilldata.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently, Puppeteer supports auto-filling credit card information only and in Chrome in the new headless and headful modes only.

```ts
// Select an input on the credit card form.
const name = await page.waitForSelector('form #name');
// Trigger autofill with the desired data.
await name.autofill({
  creditCard: {
    number: '4444444444444444',
    name: 'John Smith',
    expiryMonth: '01',
    expiryYear: '2030',
    cvc: '123',
  },
});
```
