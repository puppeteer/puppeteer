# Puppeteer
<!-- [START badges] -->
[![Linux Build Status](https://img.shields.io/travis/GoogleChrome/puppeteer/master.svg)](https://travis-ci.org/GoogleChrome/puppeteer) [![Windows Build Status](https://img.shields.io/appveyor/ci/aslushnikov/puppeteer/master.svg?logo=appveyor)](https://ci.appveyor.com/project/aslushnikov/puppeteer/branch/master) [![NPM puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)
<!-- [END badges] -->

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right">

###### [API](docs/api.md) | [FAQ](#faq) | [Contributing](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

> Puppeteer 是一个通过[DevTools 协议](https://chromedevtools.github.io/devtools-protocol/)去提供更高级别的API以去控制 [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) Chrome 或者 Chromium 的一个Node 仓库， 同时他还可以通过配置去支持完整的 （non-headless）Chrome 或者 Chromium

<!-- [START usecases] -->
###### 我能帮你干什么?

大部分通过你手动在浏览器执行的事情都可以通过 Puppeteer 来进行！下面是几个可以帮助你快速开始的例子：

* 生成当前页面的截图或者PDF
* 抓取单页面应用（SPA）并且还支持生成他通过服务端渲染(SSR)生成的内容
* 从网站获取内容
* 表单的自动提交，UI测试，键盘输入事件等等
* 创建一个最新的自动测试环境，能够直接将你的测试用例运行在最新版本的Chrome，并且可以使用最新的JavaScript和浏览器特性
* 捕获你的网站的 [timeline trace](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference)来帮助你分析并诊断网站的一些性能问题

<!-- [END usecases] -->

传送门: https://try-puppeteer.appspot.com/

<!-- [START getstarted] -->
## 快速开始

### 安装

想要在你的项目里面使用Puppeteer，只需要运行:
```
npm i --save puppeteer
# or "yarn add puppeteer"
```

注意:当你安装Puppeteer的时候，他会自动的下载最近一个版本的Chromium（Mac的是大约71Mb，Linux的是大约90Mb，Windows的是大约110Mb），这样子才能保证我们的API能够正常运行，如果要跳过下载可以去看看[环境变量 Environment variables](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#environment-variables)

### 使用方式

注意: Puppeteer本身运行时需要的Node版本是大于v6.4.0即可，但是下面的这些例子有用到async/await特性，这些特性需要v7.6.0或者更高的版本来支持

如果你是用过其他的浏览器测试框架，那Puppeteer对于你来说是很熟悉的，你创建一个`Browser`的实例来生成pages，通过pages就能直接来操作[Puppeteer的API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#)

**示例** - 打开 https://example.com 并且将打开的页面生成一张名为*example.png*的图片

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();
```

Puppeteer在初始化页面的时候视窗尺寸初始化设置为 800px x 600px，这也是截图的尺寸，也可以通过 [`Page.setViewprot()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagesetviewportviewport) 来设置页面的尺寸

**示例** - 生成一个PDF

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', {waitUntil: 'networkidle2'});
  await page.pdf({path: 'hn.pdf', format: 'A4'});

  await browser.close();
})();
```
通过[`Page.pdf()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions)这个链接可以获取更多的关于生成pdf的信息

**示例** - 将打开的页面作为上下文来执行 JavaScript 代码

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Get the "viewport" of the page, as reported by the page.
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  console.log('Dimensions:', dimensions);

  await browser.close();
})();
```
可以查阅[`Page.evaluate()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatepagefunction-args)看到更多的 `evaluate` 方法的信息，同样的，还可以看到比如说 `evaluateOnNewDocument` 和 `exposeFunction`这些方法的信息

<!-- [END getstarted] -->

<!-- [START runtimesettings] -->
## 运行环境默认设置

**  1. 使用 Headless 模式 **

Puppeteer在[headless 模式](https://developers.google.com/web/updates/2017/04/headless-chrome)下启动一个Chromium，如果想启动一个完整版本的Chromium（`a full version of Chromium`）,可以再生成browser示例的时候通过设置 ['headless options'](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)来达到目的

```js
const browser = await puppeteer.launch({headless: false}); // default is true
```

**2. 运行指定版本的Chromium**

一般情况下，Puppeteer 会下载一个具体版本的Chromium，所以这些API能够保证开箱即用。 如果想通过Puppeteer来使用不同版本的 Chrome 或者 Chromium， 只要在生成 `Browser` 实例的时候指定它的路径就可以

```js
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```
可以通过查阅 [`Puppeteer.launch()`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)来获取更多的信息

可以通过查阅 [这篇文章](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/) 查看不同版本的 Chromium 和 Chrome之间的区别,  [这篇文章](https://chromium.googlesource.com/chromium/src/+/lkcr/docs/chromium_browser_vs_google_chrome.md) 阐述了对于 Linux 用户来说他们的一些区别

**3. 创建一个新的用户的配置文件**

Puppeteer会创建自己的Chromium用户的配置文件，**并且在每次运行（完毕 `原文未说在运行完毕时清理，这里为译者根据上下文确定的信息`）时清理它**

<!-- [END runtimesettings] -->

## API 文档

查阅 [API 文档](docs/api.md) 和 [示例](https://github.com/GoogleChrome/puppeteer/tree/master/examples/)可以获取更多信息

<!-- [START debugging] -->
## Debugging 提示

1. 关闭 headless 模式 - 有时候浏览器显示什么内容对于我们来说是有帮助的，通过设置 `headless: false`可以用来打开一个 full version的浏览器

```js
const browser = await puppeteer.launch({headless: false});
```
2. 慢放 - 通过设置 `slowMo` 参数可以让Puppeteer 放缓指定毫秒数来执行操作，这样做的作用是可以用来查看这个过程里面到底发生了什么

```js
const browser = await puppeteer.launch({
  headless: false,
  slowMo: 250 // slow down by 250ms
});
```
3. 获取控制台（console）的输出 - 你可以监听 `console` 时间，这个可以帮助你在执行 `page.evaluate()` 方法的时候来调试代码

```js
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

await page.evaluate(() => console.log(`url is ${location.href}`));
```

4. 开启详细的日志记录 - 所有在`puppeteer`命名空间下的公共的 API 调用和 内部协议的调用都可以通过 [`debug`](https://github.com/visionmedia/debug) 模块来记录

```bash
# Basic verbose logging
env DEBUG="puppeteer:*" node script.js

# Debug output can be enabled/disabled by namespace
env DEBUG="puppeteer:*,-puppeteer:protocol" node script.js # everything BUT protocol messages
env DEBUG="puppeteer:session" node script.js # protocol session messages (protocol messages to targets)
env DEBUG="puppeteer:mouse,puppeteer:keyboard" node script.js # only Mouse and Keyboard API calls

# Protocol traffic can be rather noisy. This example filters out all Network domain messages
env DEBUG="puppeteer:*" env DEBUG_COLORS=true node script.js 2>&1 | grep -v '"Network'
```

<!-- [END debugging] -->

## 给Puppeteer添砖加瓦

查阅 [共建指南](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)可以获取到有关Puppeteer发展的概览

<!-- [START faq] -->

# FAQ

#### Q: Puppeteer使用的是哪一个版本的Chromium ?

可以通过查看  [package.json](https://github.com/GoogleChrome/puppeteer/blob/master/package.json) 的里面的 `chromium_revision` 字段来得知当前的Puppeteer使用的是哪个版本的 Chromium

Puppeteer会绑定一个版本的 Chromium 来确保使用的最新的功能的可用性，当然随着DevTools协议和浏览器的更新，Puppeteer也会更新绑定的Chromium版本到一个新的版本

#### Q: Puppeteer, Selenium / WebDriver 和 PhantomJs 之间的区别是什么?

Seleniun / WebDriver 是一个成熟完善的跨浏览器API， 经常用来测试跨平台的场景

Puppeteer 只是运行在 Chromium 或者 Chrome下，但是，很多团队仅仅是只想在一个浏览器环境下运行测试用例（比如PhantomJS），在非测试用例中，Puppeteer提供了简单但是强大的API,因为她只针对一个浏览器，可以帮助您高效快速的开发自动化脚本

Puppeteer 会绑定最新版本的Chromium

#### Q: Puppeteer是谁在维护

Chrome DevTools 团队在维护这个仓库，但是我们非常期待您在项目中提供帮助和一些专业知识
[Contributing](https://github.com/GoogleChrome/puppeteer/blob/master/CONTRIBUTING.md)

#### Q: 为什么 Chrome 团队会开发 Puppeteer?

项目的目标其实很简单:
- 提供一个简单，规范的库来突出 [DevTools 协议](https://chromedevtools.github.io/devtools-protocol/) 的功能
- 为类似的测试类库提供参考实现，最终的目标是这些类库可以吧Puppeteer作为基础类库来实现
- 能够带动起来 headless/automated 的浏览器测试
- 帮助测试（dogfood？）新的DevTool 协议的功能... 并且发现bugs
- 通过学习浏览器自动化测试来发现其中的痛点并且帮助解决他们

#### Q: 比较下Puppeteer和其他 headless Chrome的项目？

过去的几个月我们得到了[几个自动化headless Chrome类库](https://medium.com/@kensoh/chromeless-chrominator-chromy-navalia-lambdium-ghostjs-autogcd-ef34bcd26907)，作为开发DevTools协议的团队，我们很激动的见证和支持者这个蓬勃发展的系统

我们已经联系了一些这样子的项目，如果有机会可以合作，我们很高兴提供我们能够提供的帮助

#### Q: Puppeteer还有那些功能尚未支持？

在包含视频和音频的页面中，您可能会发现Puppeteer的不足（比如：[video的播放/截图没有成功](https://github.com/GoogleChrome/puppeteer/issues/291)）原因有二：

* Puppeteer是和Chromium打包在一起，而不是Chrome，所以默认的是这样子的，他继承了所有的 [Chromium's media-related limitations](https://www.chromium.org/audio-video).这就意味着Puppeteer不支持类似 AAC 或者 H.264 这种的认证，（然而，需要强调的是可以通过[`executablePath` option to `puppeteer.launch`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)选项来使用单独安装的某个支持media formats版本的Chrome而不是继续使用Chromium）
* 由于Puppeteer（在所有的配置中）实在控制桌面版的Chromium/Chrome，所以如果是仅支持移动端的Chrome将不被支持，这意味着Puppeteer将不支持 [HTTP Live Streaming](https://caniuse.com/#feat=http-live-streaming)

<!-- [END faq] -->
