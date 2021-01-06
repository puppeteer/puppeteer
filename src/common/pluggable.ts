/*
Inversion of Control pattern to allow for various pluggable providers.
*/

import { HTTPRequest } from './HTTPRequest';
import { NetworkManager } from './NetworkManager';

const makeProvider = <T>(cls: T) => {
  let ref: T = cls;
  return {
    get: () => ref,
    set: (newRef: T) => (ref = newRef),
  };
};

export default {
  NetworkManager: makeProvider(NetworkManager),
  HTTPRequest: makeProvider(HTTPRequest),
};
