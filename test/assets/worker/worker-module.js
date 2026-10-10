import {importedValue} from './imported-module.js';

self.onmessage = () => {
  self.postMessage(importedValue);
};
