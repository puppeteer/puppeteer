# Puppeteer - Tiếng Việt 🇻🇳

[![build](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml)
[![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

> Puppeteer là thư viện JavaScript cung cấp API cấp cao để điều khiển Chrome hoặc Firefox qua [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) hoặc [WebDriver BiDi](https://pptr.dev/webdriver-bidi).
> Puppeteer chạy ở chế độ headless (không có giao diện) theo mặc định.

## [Bắt đầu](https://pptr.dev/docs) | [API](https://pptr.dev/api) | [FAQ](https://pptr.dev/faq) | [Đóng góp](https://pptr.dev/contributing) | [Khắc phục sự cố](https://pptr.dev/troubleshooting)

## Cài đặt

```bash npm2yarn
npm i puppeteer # Tải Chrome tương thích trong quá trình cài đặt.
npm i puppeteer-core # Hoặc cài đặt như thư viện, không tải Chrome.
```

## MCP

Cài đặt [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp),
máy chủ MCP dựa trên Puppeteer cho tự động hóa và gỡ lỗi trình duyệt.

## Ví dụ

```ts
import puppeteer from 'puppeteer';
// Hoặc import puppeteer từ puppeteer-core;

// Khởi chạy trình duyệt và mở trang mới.
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Điều hướng trang đến URL.
await page.goto('https://developer.chrome.com/');

// Đặt kích thước màn hình.
await page.setViewport({width: 1080, height: 1024});

// Mở menu tìm kiếm bằng bàn phím.
await page.keyboard.press('/');

// Gõ vào ô tìm kiếm bằng input có thể truy cập.
await page.locator('::-p-aria(Search)').fill('automate beyond recorder');

// Chờ và click vào kết quả đầu tiên.
await page.locator('.devsite-result-item-link').click();

// Tìm tiêu đề đầy đủ bằng chuỗi duy nhất.
const textSelector = await page
  .locator('::-p-text(Customize and automate)')
  .waitHandle();
const fullTitle = await textSelector?.evaluate(el => el.textContent);

// In tiêu đề đầy đủ.
console.log('Tiêu đề bài viết này là "%s".', fullTitle);

await browser.close();
```

## Tài liệu tiếng Việt

- [Hướng dẫn cơ bản](https://pptr.dev/guide)
- [API Reference](https://pptr.dev/api)
- [FAQ - Câu hỏi thường gặp](https://pptr.dev/faq)

## Đóng góp

Đóng góp của bạn rất quan trọng! Xem [hướng dẫn đóng góp](https://pptr.dev/contributing) để biết thêm chi tiết.

## License

MIT
