# Troubleshooting

## Chrome headless doesn't start on Debian (e.g. Ubuntu)

- Make sure all the necessary dependencies are installed
- The broad discussion on the topic can be found in [#290](https://github.com/GoogleChrome/puppeteer/issues/290)

<details>
<summary>Debian Dependencies</summary>

```
gconf-service
libasound2
libatk1.0-0
libc6
libcairo2
libcups2
libdbus-1-3
libexpat1
libfontconfig1
libgcc1
libgconf-2-4
libgdk-pixbuf2.0-0
libglib2.0-0
libgtk-3-0
libnspr4
libpango-1.0-0
libpangocairo-1.0-0
libstdc++6
libx11-6
libx11-xcb1
libxcb1
libxcomposite1
libxcursor1
libxdamage1
libxext6
libxfixes3
libxi6
libxrandr2
libxrender1
libxss1
libxtst6
ca-certificates
fonts-liberation
libappindicator1
libnss3
lsb-release
xdg-utils
wget
```
</details>

## Chrome Headless fails due to sandbox issues

- make sure kernel version is up-to-date
- read about linux sandbox here: https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md
- try running without the sandbox (**Note: running without the sandbox is not recommended due to security reasons!**)
```js
const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
```

