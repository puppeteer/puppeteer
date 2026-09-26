// Fetches every URL it is sent and posts back the response bodies, or
// 'error' for failed fetches and 'timeout' for fetches that never settle.
self.onmessage = async event => {
  const {urls, init} = event.data;
  const results = await Promise.all(
    urls.map(url => {
      return Promise.race([
        fetch(url, init).then(
          response => {
            return response.text();
          },
          () => {
            return 'error';
          },
        ),
        new Promise(resolve => {
          return setTimeout(() => {
            return resolve('timeout');
          }, 5000);
        }),
      ]);
    }),
  );
  self.postMessage(results);
};
