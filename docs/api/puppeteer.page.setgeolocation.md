---
sidebar_label: Page.setGeolocation
---

# Page.setGeolocation() method

Sets the page's geolocation.

### Signature

```typescript
class Page {
  abstract setGeolocation(options: GeolocationOptions | null): Promise<void>;
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

options

</td><td>

[GeolocationOptions](./puppeteer.geolocationoptions.md) \| null

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Consider using [BrowserContext.overridePermissions()](./puppeteer.browsercontext.overridepermissions.md) to grant permissions for the page to read its geolocation.

Pass `null` to remove the geolocation override.

## Example

```ts
await page.setGeolocation({latitude: 59.95, longitude: 30.31667});
// Later, go back to the browser's real geolocation:
await page.setGeolocation(null);
```
