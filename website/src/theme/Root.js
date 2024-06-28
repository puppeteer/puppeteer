/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect} from 'react';
import CookieConsent, {getCookieConsentValue} from 'react-cookie-consent';

function enableGoogleAnalytics() {
  const hasConsent = getCookieConsentValue();
  if (!hasConsent) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-J15CTWBVHX', {anonymize_ip: true});
}

export default function Root({children}) {
  useEffect(enableGoogleAnalytics, []);

  return (
    <>
      {children}
      <CookieConsent
        location="bottom"
        buttonText="Okay, got it!"
        disableButtonStyles={true}
        buttonWrapperClasses="padding--sm"
        buttonClasses="button button--primary button--outline"
        contentStyle={{
          fontSize: 'inherit',
        }}
        style={{
          color: 'var(--ifm-color-primary-contrast-foreground)',
          background: 'var(--ifm-color-primary-contrast-background)',
        }}
        onAccept={enableGoogleAnalytics}
      >
        pptr.dev, Puppeteer's documentation site, uses cookies from Google to
        deliver and enhance the quality of its services and to analyze traffic.{' '}
        <a href="https://policies.google.com/technologies/cookies">
          Learn more.
        </a>
      </CookieConsent>
    </>
  );
}
