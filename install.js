var Downloader = require('./lib/Downloader');
var revision = require('./package').puppeteer.chromium_revision;
var fs = require('fs');
var ProgressBar = require('progress');

var executable = Downloader.executablePath(revision);
if (fs.existsSync(executable))
    return;

Downloader.downloadChromium(revision, onProgress)
    .catch(error => {
        console.error('Download failed: ' + error.message);
    });

var progressBar = null;
function onProgress(bytesTotal, delta) {
    if (!progressBar) {
        progressBar = new ProgressBar(`Downloading Chromium - ${toMegabytes(bytesTotal)} [:bar] :percent :etas `, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: bytesTotal,
        });
    }
    progressBar.tick(delta);
}

function toMegabytes(bytes) {
    var mb = bytes / 1024 / 1024;
    return (Math.round(mb * 10) / 10) + ' Mb';
}

