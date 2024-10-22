/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {ExtensionTransport} from './ExtensionTransport.js';

type EventListenerFunction = (
  source: chrome.debugger.Debuggee,
  method: string,
  params?: object | undefined
) => void;

describe('ExtensionTransport', function () {
  afterEach(() => {
    sinon.restore();
  });

  function mockChrome() {
    const fakeAttach = sinon.fake.resolves<
      [chrome.debugger.Debuggee, string],
      Promise<void>
    >(undefined);
    const fakeDetach = sinon.fake.resolves<
      [chrome.debugger.Debuggee],
      Promise<void>
    >(undefined);
    const fakeSendCommand = sinon.fake.resolves<
      [chrome.debugger.Debuggee, string, object | undefined],
      Promise<object>
    >({});
    const fakeGetTargets = sinon.fake.resolves<
      [],
      Promise<chrome.debugger.TargetInfo[]>
    >([]);
    const onEvent: EventListenerFunction[] = [];
    sinon.define(globalThis, 'chrome', {
      debugger: {
        attach: fakeAttach,
        detach: fakeDetach,
        sendCommand: fakeSendCommand,
        getTargets: fakeGetTargets,
        onEvent: {
          addListener: (cb: EventListenerFunction) => {
            onEvent.push(cb);
          },
          removeListener: (cb: EventListenerFunction) => {
            const idx = onEvent.indexOf(cb);
            if (idx !== -1) {
              onEvent.splice(idx, 1);
            }
          },
        },
      },
    });
    return {
      fakeAttach,
      fakeDetach,
      fakeSendCommand,
      fakeGetTargets,
      onEvent,
    };
  }

  describe('connectTab', function () {
    it('should attach using tabId', async () => {
      const {fakeAttach, onEvent} = mockChrome();
      const transport = await ExtensionTransport.connectTab(1);
      expect(transport).toBeInstanceOf(ExtensionTransport);
      expect(fakeAttach.calledOnceWith({tabId: 1}, '1.3')).toBeTruthy();
      expect(onEvent).toHaveLength(1);
    });

    it('should detach', async () => {
      const {onEvent} = mockChrome();
      const transport = await ExtensionTransport.connectTab(1);
      transport.close();
      expect(onEvent).toHaveLength(0);
    });
  });

  describe('send', function () {
    async function testTranportResponse(command: object): Promise<string[]> {
      const {fakeSendCommand} = mockChrome();
      const transport = await ExtensionTransport.connectTab(1);
      const onmessageFake = sinon.fake();
      transport.onmessage = onmessageFake;
      transport.send(JSON.stringify(command));
      expect(fakeSendCommand.notCalled).toBeTruthy();
      return onmessageFake.getCalls().map(call => {
        return call.args[0];
      });
    }

    it('provides a dummy response to Browser.getVersion', async () => {
      expect(
        await testTranportResponse({
          id: 1,
          method: 'Browser.getVersion',
        })
      ).toStrictEqual([
        '{"id":1,"method":"Browser.getVersion","result":{"protocolVersion":"1.3","product":"chrome","revision":"unknown","userAgent":"chrome","jsVersion":"unknown"}}',
      ]);
    });

    it('provides a dummy response to Target.getBrowserContexts', async () => {
      expect(
        await testTranportResponse({
          id: 1,
          method: 'Target.getBrowserContexts',
        })
      ).toStrictEqual([
        '{"id":1,"method":"Target.getBrowserContexts","result":{"browserContextIds":[]}}',
      ]);
    });

    it('provides a dummy response and events to Target.setDiscoverTargets', async () => {
      expect(
        await testTranportResponse({
          id: 1,
          method: 'Target.setDiscoverTargets',
        })
      ).toStrictEqual([
        '{"method":"Target.targetCreated","params":{"targetInfo":{"targetId":"tabTargetId","type":"tab","title":"tab","url":"about:blank","attached":false,"canAccessOpener":false}}}',
        '{"method":"Target.targetCreated","params":{"targetInfo":{"targetId":"pageTargetId","type":"page","title":"page","url":"about:blank","attached":false,"canAccessOpener":false}}}',
        '{"id":1,"method":"Target.setDiscoverTargets","result":{}}',
      ]);
    });

    it('attaches to a dummy tab target on Target.setAutoAttach', async () => {
      expect(
        await testTranportResponse({
          id: 1,
          method: 'Target.setAutoAttach',
        })
      ).toStrictEqual([
        '{"method":"Target.attachedToTarget","params":{"targetInfo":{"targetId":"tabTargetId","type":"tab","title":"tab","url":"about:blank","attached":false,"canAccessOpener":false},"sessionId":"tabTargetSessionId"}}',
        '{"id":1,"method":"Target.setAutoAttach","result":{}}',
      ]);
    });

    it('attaches to a dummy page target on Target.setAutoAttach', async () => {
      expect(
        await testTranportResponse({
          id: 1,
          method: 'Target.setAutoAttach',
          sessionId: 'tabTargetSessionId',
        })
      ).toStrictEqual([
        '{"method":"Target.attachedToTarget","params":{"targetInfo":{"targetId":"pageTargetId","type":"page","title":"page","url":"about:blank","attached":false,"canAccessOpener":false},"sessionId":"pageTargetSessionId"}}',
        '{"id":1,"sessionId":"tabTargetSessionId","method":"Target.setAutoAttach","result":{}}',
      ]);
    });

    it('rewrites session id for pageTargetSessionId commands', async () => {
      const {fakeSendCommand} = mockChrome();
      const transport = await ExtensionTransport.connectTab(1);
      transport.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {},
          sessionId: 'pageTargetSessionId',
        })
      );
      expect(fakeSendCommand.calledOnce).toBeTruthy();
      expect(fakeSendCommand.lastCall.args).toStrictEqual([
        {
          tabId: 1,
          sessionId: undefined,
        },
        'Runtime.evaluate',
        {},
      ]);
    });
  });
});
