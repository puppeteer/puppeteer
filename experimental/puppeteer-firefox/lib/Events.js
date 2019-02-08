const Events = {
  Page: {
    Close: 'close',
    Console: 'console',
    Dialog: 'dialog',
    DOMContentLoaded: 'domcontentloaded',
    FrameAttached: 'frameattached',
    FrameDetached: 'framedetached',
    FrameNavigated: 'framenavigated',
    Load: 'load',
    PageError: 'pageerror',
  },
  Browser: {
    TargetCreated: 'targetcreated',
    TargetChanged: 'targetchanged',
    TargetDestroyed: 'targetdestroyed',
  },
  BrowserContext: {
    TargetCreated: 'targetcreated',
    TargetChanged: 'targetchanged',
    TargetDestroyed: 'targetdestroyed',
  },

  Connection: {
    Disconnected: Symbol('Events.Connection.Disconnected'),
  },
};

module.exports = {Events};
