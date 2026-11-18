/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {
  createHarness,
  recordTargetEvents,
  targetIds,
} from './MockCdp.test-utils.js';

describe('Target events', function () {
  for (const activateFirst of [true, false]) {
    it(`should emit targetcreated for an activated prerender target (${activateFirst ? 'activation first' : 'detach first'})`, async () => {
      const h = createHarness();
      await h.attach();
      const tab = h.attachTab('main');
      await h.flush();
      const firstTarget = h.browser.targets()[0]!;
      const page = (await firstTarget.page())!;

      const events = recordTargetEvents(h);
      const prerender = h.attachChild(
        tab.tabSessionId,
        'page-prerender',
        'page',
        {subtype: 'prerender', url: 'https://example.com/prerender'},
      );
      await h.flush();
      // A prerender target is not exposed and has no events.
      expect(events).toEqual([]);
      expect(targetIds(h.browser.targets())).toEqual(['page-main']);

      const activate = () => {
        h.transport.emitEvent('Target.targetInfoChanged', {
          targetInfo: {...prerender.info, subtype: undefined},
        });
      };
      if (activateFirst) {
        activate();
        tab.detachChild(tab.page!.sessionId);
      } else {
        tab.detachChild(tab.page!.sessionId);
        activate();
      }
      await h.flush();

      expect(events).toEqual(
        activateFirst
          ? ['targetcreated:page-prerender', 'targetdestroyed:page-main']
          : ['targetdestroyed:page-main', 'targetcreated:page-prerender'],
      );
      expect(targetIds(h.browser.targets())).toEqual(['page-prerender']);
      const activatedTarget = h.browser.targets()[0]!;
      await expect(activatedTarget.page()).resolves.toBe(page);
      await expect(h.browser.pages()).resolves.toEqual([page]);
    });
  }

  it('should emit targetchanged only for exposed targets', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const events = recordTargetEvents(h);

    tab.updateTab({url: 'https://example.com/tab-changed'});
    h.transport.emitEvent('Target.targetInfoChanged', {
      targetInfo: {
        ...tab.page!.info,
        url: 'https://example.com/page-changed',
      },
    });
    await h.flush();

    expect(events).toEqual(['targetchanged:page-main']);
  });

  it('should emit targetdestroyed only after targetcreated', async () => {
    const h = createHarness();
    await h.attach();
    const events = recordTargetEvents(h);
    const tab = h.attachTab('main');
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();

    tab.detachChild(prerender.sessionId);
    tab.detachChild(tab.page!.sessionId);
    await h.flush();

    expect(events).toEqual([
      'targetcreated:page-main',
      'targetdestroyed:page-main',
    ]);
  });

  it(
    'should finish initialization if a tab detaches before its page attaches',
    {timeout: 5000},
    async () => {
      const h = createHarness();
      await h.attach(() => {
        const tab = h.attachTab('gone', {attachPage: false});
        tab.close();
      });
      expect(h.browser.targets()).toEqual([]);
    },
  );
});
