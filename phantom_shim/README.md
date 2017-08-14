# PhantomShim

PhantomShim is a phantomJS script runner built atop of Puppeteer API.

### Q: Can I use PhantomShim to run my scripts?
No.

PhantomShim aims to pass PhantomJS tests rather then to be a valid PhantomJS script runner:
- PhantomShim shortcuts a lot of corners (e.g. [handling only a few keys](https://github.com/GoogleChrome/puppeteer/blob/4269f6a1bb0c2d1cc27a9ed1132017669c33a259/phantom_shim/WebPage.js#L75) that are necessary to pass tests).
- PhantomShim spawns [nested event loops](https://github.com/abbr/deasync) to emulate PhantomJS execution model. This might result in unpredictable side-effects, e.g. in [unexpected reenterability](https://github.com/GoogleChrome/puppeteer/blob/4269f6a1bb0c2d1cc27a9ed1132017669c33a259/phantom_shim/WebPage.js#L694).

### Q: What's the purpose of PhantomShim? 
The goal is to prove comprehensiveness of Puppeteer API.

PhantomShim is built atop of Puppeteer API and is used to run PhantomJS tests.
Whenever PhantomShim can't implement certain capability to pass phantomJS test, Puppeteer API is improved to make it possible.

### Q: Are there plans to evolve PhantomShim into a real PhantomJS script runner?
No.

On the contrary, PhantomShim is likely to be removed from the Puppeteer repository as it passes all interesting PhantomJS tests.