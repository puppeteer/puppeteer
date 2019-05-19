# Troubleshooting

<!-- GEN:toc -->
- [Chrome headless doesn't launch on Windows](#chrome-headless-doesnt-launch-on-windows)
- [Chrome headless doesn't launch on UNIX](#chrome-headless-doesnt-launch-on-unix)
- [Setting Up Chrome Linux Sandbox](#setting-up-chrome-linux-sandbox)
  * [[recommended] Enable user namespace cloning](#recommended-enable-user-namespace-cloning)
  * [[alternative] Setup setuid sandbox](#alternative-setup-setuid-sandbox)
- [Running Puppeteer on Travis CI](#running-puppeteer-on-travis-ci)
- [Running Puppeteer in Docker](#running-puppeteer-in-docker)
  * [Running on Alpine](#running-on-alpine)
    - [Tips](#tips)
- [Running Puppeteer in the cloud](#running-puppeteer-in-the-cloud)
  * [Running Puppeteer on Google App Engine](#running-puppeteer-on-google-app-engine)
  * [Running Puppeteer on Google Cloud Functions](#running-puppeteer-on-google-cloud-functions)
  * [Running Puppeteer on Heroku](#running-puppeteer-on-heroku)
  * [Running Puppeteer on AWS Lambda](#running-puppeteer-on-aws-lambda)
- [Code Transpilation Issues](#code-transpilation-issues)
<!-- GEN:stop -->

## Chrome headless doesn't launch on Windows

Some [chrome policies](https://support.google.com/chrome/a/answer/7532015?hl=en) might enforce running Chrome/Chromium
with certain extensions.

Puppeteer passes `--disable-extensions` flag by default and will fail to launch when such policies are active.

To work around this, try running without the flag:

```js
const browser = await puppeteer.launch({
  ignoreDefaultArgs: ['--disable-extensions'],
});
```

> Context: [issue 3681](https://github.com/GoogleChrome/puppeteer/issues/3681#issuecomment-447865342).

## Chrome headless doesn't launch on UNIX

Make sure all the necessary dependencies are installed. You can run `ldd chrome | grep not` on a Linux
machine to check which dependencies are missing. The common ones are provided below.

<details>
<summary>Debian (e.g. Ubuntu) Dependencies</summary>

```
gconf-service
libasound2
libatk1.0-0
libatk-bridge2.0-0
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

After installing dependencies you need to update nss library using this command

```
yum update nss -y
```
</details>

<details>
  <summary>Check out discussions</summary>
  
- [#290](https://github.com/GoogleChrome/puppeteer/issues/290) - Debian troubleshooting <br/>
- [#391](https://github.com/GoogleChrome/puppeteer/issues/391) - CentOS troubleshooting <br/>
- [#379](https://github.com/GoogleChrome/puppeteer/issues/379) - Alpine troubleshooting <br/>
</details>

## Setting Up Chrome Linux Sandbox

In order to protect the host environment from untrusted web content, Chrome uses [multiple layers of sandboxing](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux_sandboxing.md). For this to work properly,
the host should be configured first. If there's no good sandbox for Chrome to use, it will crash
with the error `No usable sandbox!`.

If you **absolutely trust** the content you open in Chrome, you can launch Chrome
with the `--no-sandbox` argument:

```js
const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
```

> **NOTE**: Running without a sandbox is **strongly discouraged**. Consider configuring a sandbox instead.

There are 2 ways to configure a sandbox in Chromium.

### [recommended] Enable [user namespace cloning](http://man7.org/linux/man-pages/man7/user_namespaces.7.html)

User namespace cloning is only supported by modern kernels. Unprivileged user namespaces are generally fine to enable,
but in some cases they open up more kernel attack surface for (unsandboxed) non-root processes to elevate to
kernel privileges.

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

### [alternative] Setup [setuid sandbox](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux_suid_sandbox_development.md)

The setuid sandbox comes as a standalone executable and is located next to the Chromium that Puppeteer downloads. It is
fine to re-use the same sandbox executable for different Chromium versions, so the following could be
done only once per host environment:

```bash
# cd to the downloaded instance
cd <project-dir-path>/node_modules/puppeteer/.local-chromium/linux-<revision>/chrome-linux/
sudo chown root:root chrome_sandbox
sudo chmod 4755 chrome_sandbox
# copy sandbox executable to a shared location
sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox
# export CHROME_DEVEL_SANDBOX env variable
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```

You might want to export the `CHROME_DEVEL_SANDBOX` env variable by default. In this case, add the following to the `~/.bashrc`
or `.zshenv`:

```bash
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```


## Running Puppeteer on Travis CI

> 👋 We run our tests for Puppeteer on Travis CI - see our [`.travis.yml`](https://github.com/GoogleChrome/puppeteer/blob/master/.travis.yml) for reference.

Tips-n-tricks:
- The `libnss3` package must be installed in order to run Chromium on Ubuntu Trusty
- [user namespace cloning](http://man7.org/linux/man-pages/man7/user_namespaces.7.html) should be enabled to support
  proper sandboxing
- [xvfb](https://en.wikipedia.org/wiki/Xvfb) should be launched in order to run Chromium in non-headless mode (e.g. to test Chrome Extensions)

To sum up, your `.travis.yml` might look like this:

```yml
language: node_js
dist: trusty
addons:
  apt:
    packages:
      # This is required to run new chrome on old trusty
      - libnss3
notifications:
  email: false
cache:
  directories:
    - node_modules
# allow headful tests
before_install:
  # Enable user namespace cloning
  - "sysctl kernel.unprivileged_userns_clone=1"
  # Launch XVFB
  - "export DISPLAY=:99.0"
  - "sh -e /etc/init.d/xvfb start"
```


## Running Puppeteer in Docker

> 👋 We use [Cirrus Ci](https://cirrus-ci.org/) to run our tests for Puppeteer in a Docker container - see our [`Dockerfile.linux`](https://github.com/GoogleChrome/puppeteer/blob/master/.ci/node8/Dockerfile.linux) for reference.

Getting headless Chrome up and running in Docker can be tricky.
The bundled Chromium that Puppeteer installs is missing the necessary
shared library dependencies.

To fix, you'll need to install the missing dependencies and the
latest Chromium package in your Dockerfile:

```Dockerfile
FROM node:10-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# uncomment the following lines to have `dumb-init` as PID 1
# ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
# RUN chmod +x /usr/local/bin/dumb-init
# ENTRYPOINT ["dumb-init", "--"]

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install puppeteer so it's available in the container.
RUN npm i puppeteer \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /node_modules

# Run everything after as non-privileged user.
USER pptruser

CMD ["google-chrome-unstable"]
```

Build the container:

```bash
docker build -t puppeteer-chrome-linux .
```

Run the container by passing `node -e "<yourscript.js content as a string>` as the command:

```bash
 docker run -i --init --rm --cap-add=SYS_ADMIN \
   --name puppeteer-chrome puppeteer-chrome-linux \
   node -e "`cat yourscript.js`"
```

There's a full example at https://github.com/ebidel/try-puppeteer that shows
how to run this Dockerfile from a webserver running on App Engine Flex (Node).

### Running on Alpine

The [newest Chromium package](https://pkgs.alpinelinux.org/package/edge/community/x86_64/chromium) supported on Alpine is 72, which was corresponding to [Puppeteer v1.11.0](https://github.com/GoogleChrome/puppeteer/releases/tag/v1.11.0).

Example Dockerfile:

```Dockerfile
FROM node:10-alpine

# Installs latest Chromium (72) package.
RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
      chromium@edge=72.0.3626.121-r0 \
      nss@edge \
      freetype@edge \
      harfbuzz@edge \
      ttf-freefont@edge

...

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Puppeteer v1.11.0 works with Chromium 72.
RUN yarn add puppeteer@1.11.0

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

...
```

And when launching Chrome, be sure to use the `chromium-browser` executable:

```js
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser'
});
```

#### Tips

By default, Docker runs a container with a `/dev/shm` shared memory space 64MB.
This is [typically too small](https://github.com/c0b/chrome-in-docker/issues/1) for Chrome
and will cause Chrome to crash when rendering large pages. To fix, run the container with
`docker run --shm-size=1gb` to increase the size of `/dev/shm`. Since Chrome 65, this is no
longer necessary. Instead, launch the browser with the `--disable-dev-shm-usage` flag:

```js
const browser = await puppeteer.launch({
  args: ['--disable-dev-shm-usage']
});
```

This will write shared memory files into `/tmp` instead of `/dev/shm`. See [crbug.com/736452](https://bugs.chromium.org/p/chromium/issues/detail?id=736452) for more details.

Seeing other weird errors when launching Chrome? Try running your container
with `docker run --cap-add=SYS_ADMIN` when developing locally. Since the Dockerfile
adds a `pptr` user as a non-privileged user, it may not have all the necessary privileges.

[dumb-init](https://github.com/Yelp/dumb-init) is worth checking out if you're
experiencing a lot of zombies Chrome processes sticking around. There's special
treatment for processes with PID=1, which makes it hard to terminate Chrome
properly in some cases (e.g. in Docker).

## Running Puppeteer in the cloud

### Running Puppeteer on Google App Engine

The Node.js runtime of the [App Engine standard environment](https://cloud.google.com/appengine/docs/standard/nodejs/) comes with all system packages needed to run Headless Chrome.

To use `puppeteer`, simply list the module as a dependency in your `package.json` and deploy to Google App Engine. Read more about using `puppeteer` on App Engine by following [the official tutorial](https://cloud.google.com/appengine/docs/standard/nodejs/using-headless-chrome-with-puppeteer).

### Running Puppeteer on Google Cloud Functions

The Node.js 8 runtime of [Google Cloud Functions](https://cloud.google.com/functions/docs/) comes with all system packages needed to run Headless Chrome.

To use `puppeteer`, simply list the module as a dependency in your `package.json` and deploy your function to Google Cloud Functions using the `nodejs8` runtime.

### Running Puppeteer on Heroku

Running Puppeteer on Heroku requires some additional dependencies that aren't included on the Linux box that Heroku spins up for you. To add the dependencies on deploy, add the Puppeteer Heroku buildpack to the list of buildpacks for your app under Settings > Buildpacks.

The url for the buildpack is https://github.com/jontewks/puppeteer-heroku-buildpack

When you click add buildpack, simply paste that url into the input, and click save. On the next deploy, your app will also install the dependencies that Puppeteer needs to run.

If you need to render Chinese, Japanese, or Korean characters you may need to use a buildpack with additional font files like https://github.com/CoffeeAndCode/puppeteer-heroku-buildpack

There's also another [simple guide](https://timleland.com/headless-chrome-on-heroku/) from @timleland that includes a sample project: https://timleland.com/headless-chrome-on-heroku/.

### Running Puppeteer on AWS Lambda

AWS Lambda [limits](https://docs.aws.amazon.com/lambda/latest/dg/limits.html) deployment package sizes to ~50MB. This presents challenges for running headless Chrome (and therefore Puppeteer) on Lambda. The community has put together a few resources that work around the issues:

- https://github.com/alixaxel/chrome-aws-lambda (kept updated with the latest stable release of puppeteer)
- https://github.com/adieuadieu/serverless-chrome/blob/master/docs/chrome.md (serverless plugin - outdated)

## Code Transpilation Issues

If you are using a JavaScript transpiler like babel or TypeScript, calling `evaluate()` with an async function might not work. This is because while `puppeteer` uses `Function.prototype.toString()` to serialize functions while transpilers could be changing the output code in such a way it's incompatible with `puppeteer`.

Some workarounds to this problem would be to instruct the transpiler not to mess up with the code, for example, configure TypeScript to use latest ecma version (`"target": "es2018"`). Another workaround could be using string templates instead of functions:

```js
await page.evaluate(`(async() => {
   console.log('1');
})()`);
```
