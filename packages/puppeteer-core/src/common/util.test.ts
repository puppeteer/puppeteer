/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {CDPSession} from '../api/CDPSession.js';

import {
  getReadableAsTypedArray,
  getReadableFromProtocolStream,
  getSourcePuppeteerURLIfAvailable,
  parsePDFOptions,
  unitToPixels,
  withSourcePuppeteerURLIfNone,
} from './util.js';

describe('util', () => {
  describe('parsePDFOptions', () => {
    it('returns default options when none are provided', () => {
      const parsed = parsePDFOptions();
      expect(parsed.width).toBe(8.5);
      expect(parsed.height).toBe(11);
      expect(parsed.margin).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });

      const parsedCm = parsePDFOptions({}, 'cm');
      expect(parsedCm.width).toBe(21.59);
      expect(parsedCm.height).toBe(27.94);
      expect(parsedCm.margin).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });

    it('uses default dimension in lengthUnit when only width or height is omitted', () => {
      expect(parsePDFOptions({width: '5in'})).toMatchObject({
        width: 5,
        height: 11,
      });
      expect(parsePDFOptions({height: '5in'})).toMatchObject({
        width: 8.5,
        height: 5,
      });
      expect(parsePDFOptions({width: '10cm'}, 'cm')).toMatchObject({
        width: 10,
        height: 27.94,
      });
      expect(parsePDFOptions({height: '10cm'}, 'cm')).toMatchObject({
        width: 21.59,
        height: 10,
      });
    });

    it('converts CSS units using exact specification ratios', () => {
      expect(unitToPixels).toEqual({
        px: 1,
        in: 96,
        cm: 96 / 2.54,
        mm: 96 / 25.4,
        pt: 96 / 72,
        pc: 16,
      });

      expect(parsePDFOptions({width: 96, height: '96'}).width).toBe(1);
      expect(parsePDFOptions({width: 96, height: '96'}).height).toBe(1);
      expect(parsePDFOptions({width: '96px', height: '1in'}).width).toBe(1);
      expect(parsePDFOptions({width: '96px', height: '1in'}).height).toBe(1);
      expect(
        parsePDFOptions({width: '2.54cm', height: '25.4mm'}).width,
      ).toBeCloseTo(1, 12);
      expect(
        parsePDFOptions({width: '2.54cm', height: '25.4mm'}).height,
      ).toBeCloseTo(1, 12);
      expect(parsePDFOptions({width: '72pt', height: '6pc'}).width).toBeCloseTo(
        1,
        12,
      );
      expect(
        parsePDFOptions({width: '72pt', height: '6pc'}).height,
      ).toBeCloseTo(1, 12);
    });

    it('does not inflate mm dimensions across integer point boundaries (#2278)', () => {
      const parsed = parsePDFOptions({
        width: '556.27mm',
        height: '145.27mm',
      });
      expect(parsed.width * 72).toBeCloseTo((556.27 / 25.4) * 72, 10);
      expect(parsed.width * 72).toBeLessThan(1577);
    });

    it('supports lengthUnit in cm', () => {
      const parsed = parsePDFOptions(
        {
          width: '10cm',
          height: '100mm',
          margin: {
            top: '2.54cm',
            bottom: '25.4mm',
            left: '72pt',
            right: '6pc',
          },
        },
        'cm',
      );
      expect(parsed.width).toBeCloseTo(10, 12);
      expect(parsed.height).toBeCloseTo(10, 12);
      expect(parsed.margin.top).toBeCloseTo(2.54, 12);
      expect(parsed.margin.bottom).toBeCloseTo(2.54, 12);
      expect(parsed.margin.left).toBeCloseTo(2.54, 12);
      expect(parsed.margin.right).toBeCloseTo(2.54, 12);
    });

    it('handles case-insensitive unit suffixes', () => {
      expect(
        parsePDFOptions({width: '2.54CM', height: '25.4MM'}).width,
      ).toBeCloseTo(1, 12);
      expect(
        parsePDFOptions({width: '2.54CM', height: '25.4MM'}).height,
      ).toBeCloseTo(1, 12);
      expect(parsePDFOptions({width: '72PT', height: '6PC'}).width).toBeCloseTo(
        1,
        12,
      );
      expect(
        parsePDFOptions({width: '72PT', height: '6PC'}).height,
      ).toBeCloseTo(1, 12);
    });

    it('supports paper formats and enables tagged when outline is true', () => {
      const parsed = parsePDFOptions({
        format: 'a4',
        tagged: false,
        outline: true,
      });
      expect(parsed.width).toBe(8.2677);
      expect(parsed.height).toBe(11.6929);
      expect(parsed.tagged).toBe(true);

      const parsedCm = parsePDFOptions({format: 'a4'}, 'cm');
      expect(parsedCm.width).toBe(21);
      expect(parsedCm.height).toBe(29.7);
    });

    it('throws on invalid unit values and unknown paper formats', () => {
      expect(() => {
        return parsePDFOptions({width: '10invalid'});
      }).toThrow('Failed to parse parameter value: 10invalid');
      expect(() => {
        return parsePDFOptions({width: {} as never});
      }).toThrow('page.pdf() Cannot handle parameter type: object');
      expect(() => {
        return parsePDFOptions({format: 'unknown' as never});
      }).toThrow('Unknown paper format: unknown');
    });
  });

  describe('getReadableAsTypedArray', () => {
    it('closes the protocol stream if the output file cannot be opened', async () => {
      const commands: string[] = [];
      const client = {
        send: async (method: string) => {
          commands.push(method);
          if (method === 'IO.read') {
            return {data: 'abc', base64Encoded: false, eof: false};
          }
          return {};
        },
      } as unknown as CDPSession;

      const readable = await getReadableFromProtocolStream(client, 'handle');
      // The default environment cannot open files for writing.
      await expect(
        getReadableAsTypedArray(readable, 'some-path', () => {
          return undefined;
        }),
      ).rejects.toThrow('openFileForWriting is not available');
      expect(commands).toContain('IO.close');
    });
  });

  describe('withSourcePuppeteerURLIfNone', () => {
    it('does not throw when the caller frame is not available', () => {
      const original = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;
      try {
        const fn = () => {
          return 1;
        };
        expect(withSourcePuppeteerURLIfNone('evaluate', fn)).toBe(fn);
        expect(getSourcePuppeteerURLIfAvailable(fn)).toBeUndefined();
      } finally {
        Error.stackTraceLimit = original;
      }
    });
  });
});
