/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {parsePSelectors} from './PSelectorParser.js';

describe('PSelectorParser', () => {
  describe('parsePSelectors', () => {
    it('parses nested selectors', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('& > div');
      expect(updatedSelector).toEqual([[['&>div']]]);
      expect(isPureCSS).toBeTruthy();
      expect(hasPseudoClasses).toBeFalsy();
    });

    it('parses nested selectors with p-selector syntax', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('& > div >>> button');
      expect(updatedSelector).toEqual([[['&>div'], '>>>', ['button']]]);
      expect(isPureCSS).toBeFalsy();
      expect(hasPseudoClasses).toBeFalsy();
    });

    it('parses selectors with pseudo classes', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('div:focus');
      expect(updatedSelector).toEqual([[['div:focus']]]);
      expect(isPureCSS).toBeTruthy();
      expect(hasPseudoClasses).toBeTruthy();
    });

    it('parses nested selectors with pseudo classes and p-selector syntax', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] = parsePSelectors(
        '& > div:focus >>>> button:focus',
      );
      expect(updatedSelector).toEqual([
        [['&>div:focus'], '>>>>', ['button:focus']],
      ]);
      expect(isPureCSS).toBeFalsy();
      expect(hasPseudoClasses).toBeTruthy();
    });

    describe('hasAria', () => {
      it('returns false if no aria query is present', () => {
        const [, , , hasAria] = parsePSelectors('div:focus');
        expect(hasAria).toEqual(false);
      });
      it('returns true if an aria query is present', () => {
        const [, , , hasAria] = parsePSelectors(
          'div:focus >>> ::-p-aria(Text)',
        );
        expect(hasAria).toEqual(true);
      });
    });
  });
});
