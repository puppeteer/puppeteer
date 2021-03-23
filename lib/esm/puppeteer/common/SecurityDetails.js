/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The SecurityDetails class represents the security details of a
 * response that was received over a secure connection.
 *
 * @public
 */
export class SecurityDetails {
    /**
     * @internal
     */
    constructor(securityPayload) {
        this._subjectName = securityPayload.subjectName;
        this._issuer = securityPayload.issuer;
        this._validFrom = securityPayload.validFrom;
        this._validTo = securityPayload.validTo;
        this._protocol = securityPayload.protocol;
        this._sanList = securityPayload.sanList;
    }
    /**
     * @returns The name of the issuer of the certificate.
     */
    issuer() {
        return this._issuer;
    }
    /**
     * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
     * marking the start of the certificate's validity.
     */
    validFrom() {
        return this._validFrom;
    }
    /**
     * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
     * marking the end of the certificate's validity.
     */
    validTo() {
        return this._validTo;
    }
    /**
     * @returns The security protocol being used, e.g. "TLS 1.2".
     */
    protocol() {
        return this._protocol;
    }
    /**
     * @returns The name of the subject to which the certificate was issued.
     */
    subjectName() {
        return this._subjectName;
    }
    /**
     * @returns The list of {@link https://en.wikipedia.org/wiki/Subject_Alternative_Name | subject alternative names (SANs)} of the certificate.
     */
    subjectAlternativeNames() {
        return this._sanList;
    }
}
//# sourceMappingURL=SecurityDetails.js.map