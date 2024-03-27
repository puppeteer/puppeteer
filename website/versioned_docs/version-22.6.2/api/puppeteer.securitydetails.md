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

[issuer()](./puppeteer.securitydetails.issuer.md)

</td><td>

</td><td>

The name of the issuer of the certificate.

</td></tr>
<tr><td>

[protocol()](./puppeteer.securitydetails.protocol.md)

</td><td>

</td><td>

The security protocol being used, e.g. "TLS 1.2".

</td></tr>
<tr><td>

[subjectAlternativeNames()](./puppeteer.securitydetails.subjectalternativenames.md)

</td><td>

</td><td>

The list of [subject alternative names (SANs)](https://en.wikipedia.org/wiki/Subject_Alternative_Name) of the certificate.

</td></tr>
<tr><td>

[subjectName()](./puppeteer.securitydetails.subjectname.md)

</td><td>

</td><td>

The name of the subject to which the certificate was issued.

</td></tr>
<tr><td>

[validFrom()](./puppeteer.securitydetails.validfrom.md)

</td><td>

</td><td>

[Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the start of the certificate's validity.

</td></tr>
<tr><td>

[validTo()](./puppeteer.securitydetails.validto.md)

</td><td>

</td><td>

[Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the end of the certificate's validity.

</td></tr>
</tbody></table>
