const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');
const {ContentSession} = ChromeUtils.import('chrome://juggler/content/content/ContentSession.js');
const {FrameTree} = ChromeUtils.import('chrome://juggler/content/content/FrameTree.js');
const {ScrollbarManager} = ChromeUtils.import('chrome://juggler/content/content/ScrollbarManager.js');

const sessions = new Map();
const frameTree = new FrameTree(docShell);
const scrollbarManager = new ScrollbarManager(this, docShell);

const helper = new Helper();

const gListeners = [
  helper.addMessageListener(this, 'juggler:create-content-session', msg => {
    const sessionId = msg.data;
    sessions.set(sessionId, new ContentSession(sessionId, this, frameTree, scrollbarManager));
  }),

  helper.addEventListener(this, 'unload', msg => {
    helper.removeListeners(gListeners);
    for (const session of sessions.values())
      session.dispose();
    sessions.clear();
    scrollbarManager.dispose();
    frameTree.dispose();
  }),
];

