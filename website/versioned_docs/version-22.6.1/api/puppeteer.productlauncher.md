---
sidebar_label: ProductLauncher
---

# ProductLauncher class

Describes a launcher - a class that is able to create and launch a browser instance.

#### Signature:

```typescript
export declare abstract class ProductLauncher
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ProductLauncher` class.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

product

</td><td>

`readonly`

</td><td>

[Product](./puppeteer.product.md)

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[defaultArgs(object)](./puppeteer.productlauncher.defaultargs.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[executablePath(channel)](./puppeteer.productlauncher.executablepath.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[launch(options)](./puppeteer.productlauncher.launch.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>
