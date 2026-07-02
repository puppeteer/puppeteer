---
sidebar_label: PDFOptions
---

# PDFOptions interface

Valid options to configure PDF generation via [Page.pdf()](./puppeteer.page.pdf.md).

### Signature

```typescript
export interface PDFOptions
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="displayheaderfooter">displayHeaderFooter</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to show the header and footer.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="footertemplate">footerTemplate</span>

</td><td>

`optional`

</td><td>

string

</td><td>

HTML template for the print footer. Has the same constraints and support for special classes as [PDFOptions.headerTemplate](./puppeteer.pdfoptions.md#headertemplate).

</td><td>

</td></tr>
<tr><td>

<span id="format">format</span>

</td><td>

`optional`

</td><td>

[PaperFormat](./puppeteer.paperformat.md)

</td><td>

**Remarks:**

If set, this takes priority over the `width` and `height` options.

</td><td>

`letter`.

</td></tr>
<tr><td>

<span id="headertemplate">headerTemplate</span>

</td><td>

`optional`

</td><td>

string

</td><td>

HTML template for the print header. Should be valid HTML with the following classes used to inject values into them:

- `date` formatted print date

- `title` document title

- `url` document location

- `pageNumber` current page number

- `totalPages` total pages in the document

</td><td>

</td></tr>
<tr><td>

<span id="height">height</span>

</td><td>

`optional`

</td><td>

string \| number

</td><td>

Sets the height of paper. You can pass in a number or a string with a unit.

</td><td>

</td></tr>
<tr><td>

<span id="landscape">landscape</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to print in landscape orientation.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="margin">margin</span>

</td><td>

`optional`

</td><td>

[PDFMargin](./puppeteer.pdfmargin.md)

</td><td>

Set the PDF margins.

</td><td>

`undefined` no margins are set.

</td></tr>
<tr><td>

<span id="omitbackground">omitBackground</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Hides default white background and allows generating pdfs with transparency.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="outline">outline</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

**_(Experimental)_** Generate document outline.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="pageranges">pageRanges</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Paper ranges to print, e.g. `1-5, 8, 11-13`.

</td><td>

The empty string, which means all pages are printed.

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The path to save the file to.

**Remarks:**

If the path is relative, it's resolved relative to the current working directory.

</td><td>

`undefined`, which means the PDF will not be written to disk.

</td></tr>
<tr><td>

<span id="prefercsspagesize">preferCSSPageSize</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Give any CSS `@page` size declared in the page priority over what is declared in the `width` or `height` or `format` option.

</td><td>

`false`, which will scale the content to fit the paper size.

</td></tr>
<tr><td>

<span id="printbackground">printBackground</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Set to `true` to print background graphics.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="scale">scale</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Scales the rendering of the web page. Amount must be between `0.1` and `2`.

</td><td>

`1`

</td></tr>
<tr><td>

<span id="tagged">tagged</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

**_(Experimental)_** Generate tagged (accessible) PDF.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Timeout in milliseconds. Pass `0` to disable timeout.

The default value can be changed by using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md)

</td><td>

`30_000`

</td></tr>
<tr><td>

<span id="waitforfonts">waitForFonts</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

If true, waits for `document.fonts.ready` to resolve. This might require activating the page using [Page.bringToFront()](./puppeteer.page.bringtofront.md) if the page is in the background.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="width">width</span>

</td><td>

`optional`

</td><td>

string \| number

</td><td>

Sets the width of paper. You can pass in a number or a string with a unit.

</td><td>

</td></tr>
</tbody></table>
