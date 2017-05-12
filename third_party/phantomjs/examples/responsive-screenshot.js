/**
 * Captures the full height document even if it's not showing on the screen or captures with the provided range of screen sizes.
 *
 * A basic example for taking a screen shot using phantomjs which is sampled for https://nodejs-dersleri.github.io/
 *
 * usage : phantomjs responsive-screenshot.js {url} [output format] [doClipping]
 *
 * examples >
 *      phantomjs responsive-screenshot.js https://nodejs-dersleri.github.io/
 *      phantomjs responsive-screenshot.js https://nodejs-dersleri.github.io/ pdf
 *      phantomjs responsive-screenshot.js https://nodejs-dersleri.github.io/ true
 *      phantomjs responsive-screenshot.js https://nodejs-dersleri.github.io/ png true
 *
 * @author Salih sagdilek <salihsagdilek@gmail.com>
 */

/**
 * http://phantomjs.org/api/system/property/args.html
 *
 * Queries and returns a list of the command-line arguments.
 * The first one is always the script name, which is then followed by the subsequent arguments.
 */
var args = require('system').args;
/**
 * http://phantomjs.org/api/fs/
 *
 * file system api
 */
var fs = require('fs');

/**
 * http://phantomjs.org/api/webpage/
 *
 * Web page api
 */
var page = new WebPage();

/**
 * if url address does not exist, exit phantom
 */
if ( 1 === args.length ) {
    console.log('Url address is required');
    phantom.exit();
}

/**
 *  setup url address (second argument);
 */
var urlAddress = args[1].toLowerCase();


/**
 * set output extension format
 * @type {*}
 */
var ext = getFileExtension();

/**
 * set if clipping ?
 * @type {boolean}
 */
var clipping = getClipping();

/**
 * setup viewports
 */
var viewports = [
    {
        width : 1200,
        height : 800
    },
    {
        width : 1024,
        height : 768
    },
    {
        width : 768,
        height : 1024
    },
    {
        width : 480,
        height : 640
    },
    {
        width : 320,
        height : 480
    }
];

page.open(urlAddress, function (status) {
    if ( 'success' !== status ) {
        console.log('Unable to load the url address!');
    } else {
        var folder = urlToDir(urlAddress);
        var output, key;

        function render(n) {
            if ( !!n ) {
                key = n - 1;
                page.viewportSize = viewports[key];
                if ( clipping ) {
                    page.clipRect = viewports[key];
                }
                output = folder + "/" + getFileName(viewports[key]);
                console.log('Saving ' + output);
                page.render(output);
                render(key);
            }
        }

        render(viewports.length);
    }
    phantom.exit();
});

/**
 * filename generator helper
 * @param viewport
 * @returns {string}
 */
function getFileName(viewport) {
    var d = new Date();
    var date = [
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate()
    ];
    var time = [
        d.getHours() <= 9 ? '0' + d.getHours() : d.getHours(),
        d.getMinutes() <= 9 ? '0' + d.getMinutes() : d.getMinutes(),
        d.getSeconds() <= 9 ? '0' + d.getSeconds() : d.getSeconds(),
        d.getMilliseconds()
    ];
    var resolution = viewport.width + (clipping ? "x" + viewport.height : '');

    return date.join('-') + '_' + time.join('-') + "_" + resolution + ext;
}

/**
 * output extension format helper
 *
 * @returns {*}
 */
function getFileExtension() {
    if ( 'true' != args[2] && !!args[2] ) {
        return '.' + args[2];
    }
    return '.png';
}

/**
 * check if clipping
 *
 * @returns {boolean}
 */
function getClipping() {
    if ( 'true' == args[3] ) {
        return !!args[3];
    } else if ( 'true' == args[2] ) {
        return !!args[2];
    }
    return false;
}

/**
 * url to directory helper
 *
 * @param url
 * @returns {string}
 */
function urlToDir(url) {
    var dir = url
        .replace(/^(http|https):\/\//, '')
        .replace(/\/$/, '');

    if ( !fs.makeTree(dir) ) {
        console.log('"' + dir + '" is NOT created.');
        phantom.exit();
    }
    return dir;
}
