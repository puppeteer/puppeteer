---
sidebar_label: SecurityDetails
---

# SecurityDetails class

The SecurityDetails class represents the security details of a response that was received over a secure connection.

#### Signature:

```typescript
export declare class SecurityDetails
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `SecurityDetails` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="issuer">[issuer()](./puppeteer.securitydetails.issuer.md)</span>

</td><td>

</td><td>

The name of the issuer of the certificate.

</td></tr>
<tr><td>

<span id="protocol">[protocol()](./puppeteer.securitydetails.protocol.md)</span>

</td><td>

</td><td>

The security protocol being used, e.g. "TLS 1.2".

</td></tr>
<tr><td>

<span id="subjectalternativenames">[subjectAlternativeNames()](./puppeteer.securitydetails.subjectalternativenames.md)</span>

</td><td>

</td><td>

The list of [subject alternative names (SANs)](https://en.wikipedia.org/wiki/Subject_Alternative_Name) of the certificate.

</td></tr>
<tr><td>

<span id="subjectname">[subjectName()](./puppeteer.securitydetails.subjectname.md)</span>

</td><td>

</td><td>

The name of the subject to which the certificate was issued.

</td></tr>
<tr><td>

<span id="validfrom">[validFrom()](./puppeteer.securitydetails.validfrom.md)</span>

</td><td>

</td><td>

[Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the start of the certificate's validity.

</td></tr>
<tr><td>

<span id="validto">[validTo()](./puppeteer.securitydetails.validto.md)</span>

</td><td>

</td><td>

[Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the end of the certificate's validity.

</td></tr>
</tbody></table>
