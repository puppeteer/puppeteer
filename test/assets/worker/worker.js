console.log('hello from the worker');

function workerFunction() {
  return 'worker function result';
}

function remoteFetch(url) {
  const request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.send();
  return request.responseText;
}

self.addEventListener('message', event => {
  console.log('got this data: ' + event.data);
});

(async function() {
  // so that lint doesn't complain about remoteFetch being unused
  remoteFetch.toString();

  while (true) {
    self.postMessage(workerFunction.toString());
    await new Promise(x => setTimeout(x, 100));
  }
})();