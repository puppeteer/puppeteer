/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// globalThis.__PUPPETEER_DEBUG = '*';

import {Puppeteer} from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';

const puppeteer = new Puppeteer({
  isPuppeteerCore: true,
});

const tabTargetInfo = {
  targetId: 'tabTargetId',
  type: 'tab',
  title: 'tab',
  url: 'about:blank',
  attached: false,
  canAccessOpener: false,
};

const pageTargetInfo = {
  targetId: 'pageTargetId',
  type: 'page',
  title: 'page',
  url: 'about:blank',
  attached: false,
  canAccessOpener: false,
};

class Transport {
  constructor(tabId) {
    this.tabId = tabId;
  }
  send(message) {
    const parsed = JSON.parse(message);
    switch (parsed.method) {
      case 'Browser.getVersion': {
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId,
            method: parsed.method,
            result: {
              protocolVersion: '1.3',
              product: 'chrome',
              revision: 'unknown',
              userAgent: 'chrome',
              jsVersion: 'unknown',
            },
          })
        );
        return;
      }
      case 'Target.getBrowserContexts': {
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId,
            method: parsed.method,
            result: {
              browserContextIds: [],
            },
          })
        );
        return;
      }
      case 'Target.setDiscoverTargets': {
        this.onmessage(
          JSON.stringify({
            method: 'Target.targetCreated',
            params: {
              targetInfo: tabTargetInfo,
            },
          })
        );
        this.onmessage(
          JSON.stringify({
            method: 'Target.targetCreated',
            params: {
              targetInfo: pageTargetInfo,
            },
          })
        );
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId,
            method: parsed.method,
            result: {},
          })
        );
        return;
      }
      case 'Target.setAutoAttach': {
        if (parsed.sessionId === 'tabTargetSessionId') {
          this.onmessage(
            JSON.stringify({
              method: 'Target.attachedToTarget',
              params: {
                targetInfo: pageTargetInfo,
                sessionId: 'pageTargetSessionId',
              },
            })
          );
        } else if (!parsed.sessionId) {
          this.onmessage(
            JSON.stringify({
              method: 'Target.attachedToTarget',
              params: {
                targetInfo: tabTargetInfo,
                sessionId: 'tabTargetSessionId',
              },
            })
          );
        }
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId,
            method: parsed.method,
            result: {},
          })
        );
        return;
      }
    }
    if (parsed.sessionId === 'pageTargetSessionId') {
      delete parsed.sessionId;
    }
    chrome.debugger
      .sendCommand(
        {tabId: this.tabId, sessionId: parsed.sessionId},
        parsed.method,
        parsed.params
      )
      .then(response => {
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId ?? 'pageTargetSessionId',
            method: parsed.method,
            result: response,
          })
        );
      })
      .catch(err => {
        this.onmessage(
          JSON.stringify({
            id: parsed.id,
            sessionId: parsed.sessionId ?? 'pageTargetSessionId',
            method: parsed.method,
            error: err,
          })
        );
      });
  }
  close() {
    console.log('close');
  }
}

async function connect(tabId) {
  await chrome.debugger.attach({tabId}, '1.3');
  const transport = new Transport(tabId);

  chrome.debugger.onEvent.addListener((debugee, method, params) => {
    if (debugee.tabId !== tabId) {
      return;
    }
    transport.onmessage(
      JSON.stringify({
        sessionId: debugee.sessionId ?? 'pageTargetSessionId',
        method: method,
        params: params,
      })
    );
  });

  return puppeteer.connect({
    transport,
  });
}

export {connect};
