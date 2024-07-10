import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPRequest} from './HTTPRequest.js';

describe('HTTPRequest', () => {
  describe('getResponse', () => {
    it('should get body length from string', async () => {
      const body = 'How Long is this string in bytes 📏?';
      const response = HTTPRequest.getResponse(body);

      expect(response.contentLength).toBe(Buffer.from(body).byteLength);
    });
    it('should get body length from Uint8Array', async () => {
      const body = Buffer.from('How Long is this string in bytes 📏?');
      const response = HTTPRequest.getResponse(body);

      expect(response.contentLength).toBe(body.byteLength);
    });
    it('should get base64 from string', async () => {
      const body = 'What am I in base64 🤔?';
      const response = HTTPRequest.getResponse(body);

      expect(response.base64).toBe(Buffer.from(body).toString('base64'));
    });
    it('should get base64 length from Uint8Array', async () => {
      const body = Buffer.from('What am I in base64 🤔?');
      const response = HTTPRequest.getResponse(body);

      expect(response.base64).toBe(body.toString('base64'));
    });
  });
});
