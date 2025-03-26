---
sidebar_label: SuppressedError
---

# SuppressedError class

Represents an error that occurs when multiple errors are thrown during the disposal of resources. This class encapsulates the primary error and any suppressed errors that occurred subsequently.

### Signature

```typescript
export declare class SuppressedError extends Error
```

**Extends:** Error

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="_constructor_">[(constructor)(error, suppressed, message)](./puppeteer.suppressederror._constructor_.md)</span>

</td><td>

</td><td>

Constructs a new instance of the `SuppressedError` class

</td></tr>
</tbody></table>

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

<span id="error">error</span>

</td><td>

`readonly`

</td><td>

unknown

</td><td>

The primary error that occurred during disposal.

</td></tr>
<tr><td>

<span id="suppressed">suppressed</span>

</td><td>

`readonly`

</td><td>

unknown

</td><td>

The suppressed error i.e. the error that was suppressed because it occurred later in the flow after the original error.

</td></tr>
</tbody></table>
