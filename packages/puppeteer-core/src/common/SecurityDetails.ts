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

import {Protocol} from 'devtools-protocol';

/**
 * The SecurityDetails class represents the security details of a
 * response that was received over a secure connection.
 *
 * @public
 */
export class SecurityDetails {
  #subjectName: string;
  #issuer: string;
  #validFrom: number;
  #validTo: number;
  #protocol: string;
  #sanList: string[];

  /**
   * @internal
   */
  constructor(securityPayload: Protocol.Network.SecurityDetails) {
    this.#subjectName = securityPayload.subjectName;
    this.#issuer = securityPayload.issuer;
    this.#validFrom = securityPayload.validFrom;
    this.#validTo = securityPayload.validTo;
    this.#protocol = securityPayload.protocol;
    this.#sanList = securityPayload.sanList;
  }

  /**
   * @returns The name of the issuer of the certificate.
   */
  issuer(): string {
    return this.#issuer;
  }

  /**
   * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
   * marking the start of the certificate's validity.
   */
  validFrom(): number {
    return this.#validFrom;
  }

  /**
   * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
   * marking the end of the certificate's validity.
   */
  validTo(): number {
    return this.#validTo;
  }

  /**
   * @returns The security protocol being used, e.g. "TLS 1.2".
   */
  protocol(): string {
    return this.#protocol;
  }

  /**
   * @returns The name of the subject to which the certificate was issued.
   */
  subjectName(): string {
    return this.#subjectName;
  }

  /**
   * @returns The list of {@link https://en.wikipedia.org/wiki/Subject_Alternative_Name | subject alternative names (SANs)} of the certificate.
   */
  subjectAlternativeNames(): string[] {
    return this.#sanList;
  }
}
