require.stub('stubbed', 'stubbed module');
exports.stubbed = require('stubbed');
try {
    exports.child = require('./stubber_child');
} catch (e) {}
