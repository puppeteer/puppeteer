# Puppeteer

[![build](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml)
[![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right"/>

> Puppeteer 是一个 JavaScript 库，提供高级 API 来通过
> [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) 或 [WebDriver BiDi](https://pptr.dev/webdriver-bidi)
> 控制 Chrome 或 Firefox 浏览器。
> Puppeteer 默认以无头模式（无可见 UI）运行。

## [快速开始](https://pptr.dev/docs) | [API 文档](https://pptr.dev/api) | [常见问题](https://pptr.dev/faq) | [参与贡献](https://pptr.dev/contributing) | [故障排除](https://pptr.dev/troubleshooting)

## 安装

```bash npm2yarn
npm i puppeteer # 安装时下载兼容的 Chrome 浏览器。
npm i puppeteer-core # 或者仅安装库，不下载 Chrome。
```

## MCP

安装 [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp)，
一个基于 Puppeteer 的 MCP 服务器，用于浏览器自动化和调试。

Puppeteer 还支持实验性的 [WebMCP](https://pptr.dev/guides/webmcp) API。

## 示例

```ts
import puppeteer from 'puppeteer';
// 或者 import puppeteer from 'puppeteer-core';

// 启动浏览器并打开一个新的空白页面。
const browser = await puppeteer.launch();
const page = await browser.newPage();

// 导航到指定 URL。
await page.goto('https://developer.chrome.com/');

// 设置屏幕尺寸。
await page.setViewport({width: 1080, height: 1024});

// 使用键盘打开搜索菜单。
await page.keyboard.press('/');

// 使用无障碍输入名称在搜索框中输入内容。
await page.locator('::-p-aria(Search)').fill('automate beyond recorder');

// 等待并点击第一个搜索结果。
await page.locator('.devsite-result-item-link').click();

// 使用唯一字符串定位完整标题。
const textSelector = await page
  .locator('::-p-text(Customize and automate)')
  .waitHandle();
const fullTitle = await textSelector?.evaluate(el => el.textContent);

// 打印完整标题。
console.log('The title of this blog post is "%s".', fullTitle);

await browser.close();
```
