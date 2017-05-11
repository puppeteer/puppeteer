//! unsupported
var webpage = require("webpage");
var page = webpage.create();

test(function () {
    assert_equals(webpage.create, WebPage);
}, "require('webpage').create === global WebPage");

test(function () {
    assert_type_of(page, 'object');
    assert_not_equals(page, null);

    assert_equals(page.objectName, 'WebPage');
    assert_deep_equals(page.paperSize, {});

    assert_not_equals(page.settings, null);
    assert_not_equals(page.settings, {});

    assert_type_of(page.canGoForward, 'boolean');
    assert_type_of(page.canGoBack, 'boolean');
    assert_type_of(page.clipRect, 'object');
    assert_type_of(page.content, 'string');
    assert_type_of(page.cookieJar, 'object');
    assert_type_of(page.cookies, 'object');
    assert_type_of(page.customHeaders, 'object');
    assert_type_of(page.event, 'object');
    assert_type_of(page.libraryPath, 'string');
    assert_type_of(page.loading, 'boolean');
    assert_type_of(page.loadingProgress, 'number');
    assert_type_of(page.navigationLocked, 'boolean');
    assert_type_of(page.offlineStoragePath, 'string');
    assert_type_of(page.offlineStorageQuota, 'number');
    assert_type_of(page.paperSize, 'object');
    assert_type_of(page.plainText, 'string');
    assert_type_of(page.scrollPosition, 'object');
    assert_type_of(page.settings, 'object');
    assert_type_of(page.title, 'string');
    assert_type_of(page.url, 'string');
    assert_type_of(page.frameUrl, 'string');
    assert_type_of(page.viewportSize, 'object');
    assert_type_of(page.windowName, 'string');
    assert_type_of(page.zoomFactor, 'number');

}, "page object properties");

test(function () {
    assert_type_of(page.childFramesCount, 'function');
    assert_type_of(page.childFramesName, 'function');
    assert_type_of(page.clearMemoryCache, 'function');
    assert_type_of(page.close, 'function');
    assert_type_of(page.currentFrameName, 'function');
    assert_type_of(page.deleteLater, 'function');
    assert_type_of(page.destroyed, 'function');
    assert_type_of(page.evaluate, 'function');
    assert_type_of(page.initialized, 'function');
    assert_type_of(page.injectJs, 'function');
    assert_type_of(page.javaScriptAlertSent, 'function');
    assert_type_of(page.javaScriptConsoleMessageSent, 'function');
    assert_type_of(page.loadFinished, 'function');
    assert_type_of(page.loadStarted, 'function');
    assert_type_of(page.openUrl, 'function');
    assert_type_of(page.release, 'function');
    assert_type_of(page.render, 'function');
    assert_type_of(page.resourceError, 'function');
    assert_type_of(page.resourceReceived, 'function');
    assert_type_of(page.resourceRequested, 'function');
    assert_type_of(page.uploadFile, 'function');
    assert_type_of(page.sendEvent, 'function');
    assert_type_of(page.setContent, 'function');
    assert_type_of(page.switchToChildFrame, 'function');
    assert_type_of(page.switchToMainFrame, 'function');
    assert_type_of(page.switchToParentFrame, 'function');

    assert_type_of(page.addCookie, 'function');
    assert_type_of(page.deleteCookie, 'function');
    assert_type_of(page.clearCookies, 'function');
}, "page object methods");
