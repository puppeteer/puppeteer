importScripts('./imported-script.js');

self.onmessage = () => {
  self.postMessage(self.importedValue);
};
