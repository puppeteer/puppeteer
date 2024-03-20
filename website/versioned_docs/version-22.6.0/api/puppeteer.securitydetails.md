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

| Method                                                                              | Modifiers | Description                                                                                                                |
| ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| [issuer()](./puppeteer.securitydetails.issuer.md)                                   |           | The name of the issuer of the certificate.                                                                                 |
| [protocol()](./puppeteer.securitydetails.protocol.md)                               |           | The security protocol being used, e.g. "TLS 1.2".                                                                          |
| [subjectAlternativeNames()](./puppeteer.securitydetails.subjectalternativenames.md) |           | The list of [subject alternative names (SANs)](https://en.wikipedia.org/wiki/Subject_Alternative_Name) of the certificate. |
| [subjectName()](./puppeteer.securitydetails.subjectname.md)                         |           | The name of the subject to which the certificate was issued.                                                               |
| [validFrom()](./puppeteer.securitydetails.validfrom.md)                             |           | [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the start of the certificate's validity.                 |
| [validTo()](./puppeteer.securitydetails.validto.md)                                 |           | [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) marking the end of the certificate's validity.                   |
