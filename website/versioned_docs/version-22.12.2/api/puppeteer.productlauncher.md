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

<span id="product">product</span>

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

<span id="defaultargs">[defaultArgs(object)](./puppeteer.productlauncher.defaultargs.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">[executablePath(channel)](./puppeteer.productlauncher.executablepath.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="launch">[launch(options)](./puppeteer.productlauncher.launch.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
