import debug from 'debug';

export const mochaHooks = {
  async beforeAll(): Promise<void> {
    // Enable logging for Debug
    debug.enable('puppeteer:*');
  },
};
