# Troubleshooting

## Chrome headless doesn't launch

- Make sure all the necessary dependencies are installed:

<details>
<summary>Debian (e.g. Ubuntu) Dependencies</summary>

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

<details>
<summary>CentOS Dependencies</summary>

```
pango.x86_64
libXcomposite.x86_64
libXcursor.x86_64
libXdamage.x86_64
libXext.x86_64
libXi.x86_64
libXtst.x86_64
cups-libs.x86_64
libXScrnSaver.x86_64
libXrandr.x86_64
GConf2.x86_64
alsa-lib.x86_64
atk.x86_64
gtk3.x86_64
ipa-gothic-fonts
xorg-x11-fonts-100dpi
xorg-x11-fonts-75dpi
xorg-x11-utils
xorg-x11-fonts-cyrillic
xorg-x11-fonts-Type1
xorg-x11-fonts-misc
```
</details>

- Check out discussions:
  - [#290](https://github.com/GoogleChrome/puppeteer/issues/290) - Debian troubleshooting
  - [#391](https://github.com/GoogleChrome/puppeteer/issues/391) - CentOS troubleshooting


## Chrome Headless fails due to sandbox issues

- make sure kernel version is up-to-date
- read about linux sandbox here: https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md
- try running without the sandbox (**Note: running without the sandbox is not recommended due to security reasons!**)
```js
const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
```

## Running Puppeteer in Docker

Using headless Chrome Linux to run Puppeteer in Docker container can be tricky.
The bundled version Chromium that Puppeteer installs is missing the necessary
shared library dependencies.

To fix this, you'll need to install the latest version of Chrome dev in your
Dockerfile:

```
FROM node:8-slim

# Install latest chrome (dev) package.
# Note: this also installs the necessary libs so we don't need the previous RUN command.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - &&\
sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' &&\
apt-get update &&\
apt-get install -y google-chrome-unstable

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install puppeteer so it can be required by user code that gets ran in server.js.
RUN yarn add puppeteer

CMD ["google-chrome-unstable", "--no-sandbox"]
```

Build the container:

```bash
docker build -t puppeteer-chrome-linux .
```

Run the container by passing `node -e "<yourscript.js content as a string>` as the command:

```bash
 docker run -i --rm --name puppeteer-chrome puppeteer-chrome-linux node -e "`cat yourscript.js`"
```

There's a full example at https://github.com/ebidel/try-puppeteer that shows
how to run this setup from a webserver running on App Engine Flex (Node).

## Running Puppeteer on Heroku

Running Puppeteer on Heroku requires some additional dependencies that aren't included on the Linux box that Heroku spins up for you. To add the dependencies on deploy, add the Puppeteer Heroku buildpack to the list of buildpacks for your app under Settings > Buildpacks.

The url for the buildpack is https://github.com/jontewks/puppeteer-heroku-buildpack

When you click add buildpack, simply paste that url into the input, and click save. On the next deploy, your app will also install the dependencies that Puppeteer needs to run.
