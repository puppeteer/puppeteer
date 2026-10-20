const installFetchResults = {};

function fetchDuringInstall(url) {
  return fetch(url).then(
    () => {
      installFetchResults[url] = 'success';
    },
    (error) => {
      installFetchResults[url] = error.message;
    },
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      fetchDuringInstall('./blocked.json'),
      fetchDuringInstall('./allowed.json'),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  event.source.postMessage(installFetchResults);
});
