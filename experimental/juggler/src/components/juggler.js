const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
const {TCPListener} = ChromeUtils.import("chrome://juggler/content/server/server.js");
const {ChromeSession} = ChromeUtils.import("chrome://juggler/content/ChromeSession.js");

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const FRAME_SCRIPT = "chrome://juggler/content/content/main.js";

// Command Line Handler
function CommandLineHandler() {
  this._port = 0;
};

CommandLineHandler.prototype = {
  classDescription: "Sample command-line handler",
  classID: Components.ID('{f7a74a33-e2ab-422d-b022-4fb213dd2639}'),
  contractID: "@mozilla.org/remote/juggler;1",
  _xpcom_categories: [{
    category: "command-line-handler",
    entry: "m-juggler"
  }],

  /* nsICommandLineHandler */
  handle: async function(cmdLine) {
    const jugglerFlag = cmdLine.handleFlagWithParam("juggler", false);
    if (!jugglerFlag || isNaN(jugglerFlag))
      return;
    this._port = parseInt(jugglerFlag, 10);
    Services.obs.addObserver(this, 'sessionstore-windows-restored');
  },

  observe: function(subject, topic) {
    Services.obs.removeObserver(this, 'sessionstore-windows-restored');

    this._server = new TCPListener();
    this._sessions = new Map();
    this._server.onconnectioncreated = connection => {
      this._sessions.set(connection, new ChromeSession(connection));
    }
    this._server.onconnectionclosed = connection => {
      this._sessions.delete(connection);
    }
    const runningPort = this._server.start(this._port);
    Services.mm.loadFrameScript(FRAME_SCRIPT, true /* aAllowDelayedLoad */);
    dump('Juggler listening on ' + runningPort + '\n');
  },

  QueryInterface: ChromeUtils.generateQI([ Ci.nsICommandLineHandler ]),

  // CHANGEME: change the help info as appropriate, but
  // follow the guidelines in nsICommandLineHandler.idl
  // specifically, flag descriptions should start at
  // character 24, and lines should be wrapped at
  // 72 characters with embedded newlines,
  // and finally, the string should end with a newline
  helpInfo : "  --juggler            Enable Juggler automation\n"
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([CommandLineHandler]);

