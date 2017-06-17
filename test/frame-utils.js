var utils = module.exports = {
    /**
     * @param {!Page} page
     * @param {string} frameId
     * @param {string} url
     * @return {!Promise}
     */
    attachFrame: async function(page, frameId, url) {
        await page.evaluate(attachFrame, frameId, url);

        function attachFrame(frameId, url) {
            var frame = document.createElement('iframe');
            frame.src = url;
            frame.id = frameId;
            document.body.appendChild(frame);
            return new Promise(x => frame.onload = x);
        }
    },

    /**
     * @param {!Page} page
     * @param {string} frameId
     * @return {!Promise}
     */
    detachFrame: async function(page, frameId) {
        await page.evaluate(detachFrame, frameId);

        function detachFrame(frameId) {
            var frame = document.getElementById(frameId);
            frame.remove();
        }
    },

    /**
     * @param {!Page} page
     * @param {string} frameId
     * @param {string} url
     * @return {!Promise}
     */
    navigateFrame: async function(page, frameId, url) {
        await page.evaluate(navigateFrame, frameId, url);

        function navigateFrame(frameId, url) {
            var frame = document.getElementById(frameId);
            frame.src = url;
            return new Promise(x => frame.onload = x);
        }
    },

    /**
     * @param {!Frame} frame
     * @param {string=} indentation
     * @return {string}
     */
    dumpFrames: function(frame, indentation) {
        indentation = indentation || '';
        var result = indentation + frame.url();
        for (var child of frame.childFrames())
            result += '\n' + utils.dumpFrames(child, '    ' + indentation);
        return result;
    },
};
