import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

export type Reference = Extract<
  Bidi.CommonDataTypes.RemoteValue,
  Bidi.CommonDataTypes.RemoteReference
>;
