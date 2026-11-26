/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {getQueryHandlerAndSelector} from './GetQueryHandler.js';
import {PollingOptions} from './QueryHandler.js';

describe('getQueryHandlerAndSelector', () => {
  describe('polling', () => {
    it('uses mutation polling for a CSS selector', () => {
      expect(getQueryHandlerAndSelector('div > span').polling).toBe(
        PollingOptions.MUTATION,
      );
    });

    it('uses RAF polling for a CSS selector with a pseudo class', () => {
      expect(getQueryHandlerAndSelector('input:focus').polling).toBe(
        PollingOptions.RAF,
      );
    });

    it('uses mutation polling for a P selector', () => {
      expect(getQueryHandlerAndSelector('div >>> ::-p-text(a)').polling).toBe(
        PollingOptions.MUTATION,
      );
    });

    it('uses RAF polling for a P selector with a pseudo class', () => {
      expect(getQueryHandlerAndSelector('div:focus >>> span').polling).toBe(
        PollingOptions.RAF,
      );
      expect(
        getQueryHandlerAndSelector('input:focus ::-p-text(a)').polling,
      ).toBe(PollingOptions.RAF);
    });

    it('uses RAF polling for a P selector with an ARIA query', () => {
      expect(getQueryHandlerAndSelector('div >>> ::-p-aria(a)').polling).toBe(
        PollingOptions.RAF,
      );
    });
  });
});
