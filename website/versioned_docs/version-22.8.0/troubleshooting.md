# Troubleshooting

:::note

To keep this page up-to-date we largely rely on community contributions.
Please send a PR if you notice something is no longer up-to-date.

:::

## `Cannot find module 'puppeteer-core/internal/...'`

This can occur if your Node.js version is lower than 14 or if you are using a
custom resolver (such as
[`jest-resolve`](https://www.npmjs.com/package/jest-resolve)). For the former,
we do not support deprecated versions of Node.js. For the latter, usually
upgrading the resolver (or its parent module such as `jest`) will work (e.g.
https://github.com/puppeteer/puppeteer/issues/9121)

## `Could not find expected browser locally`

Starting from v19.0.0, Puppeteer will download browsers into
`~/.cache/puppeteer` using
[`os.homedir`](https://nodejs.org/api/os.html#oshomedir) for better caching
between Puppeteer upgrades. Generally the home directory is well-defined (even
on Windows), but occasionally the home directory may not be available. In this
case, we provide the `PUPPETEER_CACHE_DIR` variable which allows you to change
the installation directory.

For example,

```bash npm2yarn
PUPPETEER_CACHE_DIR=$(pwd) npm install puppeteer
PUPPETEER_CACHE_DIR=$(pwd) node <script-path>
```

You can also create a configuration file named `.puppeteerrc.cjs` (or
`puppeteer.config.cjs`) at the root of your application with the contents

```js
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
```

You will need to reinstall `puppeteer` in order for the configuration to take
effect. See [Configuring Puppeteer](./guides/configuration) for more
information.

## Chrome headless doesn't launch on Windows

Some [chrome policies](https://support.google.com/chrome/a/answer/7532015) might
enforce running Chrome/Chromium with certain extensions.

Puppeteer passes `--disable-extensions` flag by default and will fail to launch
when such policies are active.

To work around this, try running without the flag:

```ts
const browser = await puppeteer.launch({
  ignoreDefaultArgs: ['--disable-extensions'],
});
```

> Context:
> [issue 3681](https://github.com/puppeteer/puppeteer/issues/3681#issuecomment-447865342).

## Chrome doesn't launch on Linux

Make sure all the necessary dependencies are installed. You can run `ldd chrome
| grep not` on a Linux machine to check which dependencies are missing. The
common ones are provided below. Also, see
https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/debian/dist_package_versions.json
for the up-to-date list of dependencies declared by the Chrome installer.

:::caution

Chrome currently does not provide arm64 binaries for Linux.
There are only arm64 binaries for Mac ARM.
That means that Linux binaries downloaded by default will not work on Linux arm64.

:::

<details>
<summary>Debian (e.g. Ubuntu) Dependencies</summary>

```
ca-certificates
fonts-liberation
libasound2
libatk-bridge2.0-0
libatk1.0-0
libc6
libcairo2
libcups2
libdbus-1-3
libexpat1
libfontconfig1
libgbm1
libgcc1
libglib2.0-0
libgtk-3-0
libnspr4
libnss3
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
lsb-release
wget
xdg-utils
```

</details>

<details>
<summary>CentOS Dependencies</summary>

```
alsa-lib.x86_64
atk.x86_64
cups-libs.x86_64
gtk3.x86_64
ipa-gothic-fonts
libXcomposite.x86_64
libXcursor.x86_64
libXdamage.x86_64
libXext.x86_64
libXi.x86_64
libXrandr.x86_64
libXScrnSaver.x86_64
libXtst.x86_64
pango.x86_64
xorg-x11-fonts-100dpi
xorg-x11-fonts-75dpi
xorg-x11-fonts-cyrillic
xorg-x11-fonts-misc
xorg-x11-fonts-Type1
xorg-x11-utils
```

After installing dependencies you need to update `nss` library using this
command

```
yum update nss -y
```

</details>

<details>
  <summary>Check out discussions</summary>

- [#290](https://github.com/puppeteer/puppeteer/issues/290) - Debian
  troubleshooting <br/>
- [#391](https://github.com/puppeteer/puppeteer/issues/391) - CentOS
  troubleshooting <br/>
- [#379](https://github.com/puppeteer/puppeteer/issues/379) - Alpine
  troubleshooting <br/>

</details>

## chrome-headless-shell disables GPU compositing

chrome-headless-shell requires `--enable-gpu` to
[enable GPU acceleration in headless mode](https://crbug.com/1416283).

```ts
const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--enable-gpu'],
});
```

## Setting up GPU with Chrome

Generally, Chrome should be able to detect and enable GPU if the system has appropriate drivers.
For additional tips, see the following blog post https://developer.chrome.com/blog/supercharge-web-ai-testing.

## Setting Up Chrome Linux Sandbox

In order to protect the host environment from untrusted web content, Chrome uses
[multiple layers of sandboxing](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/sandboxing.md).
For this to work properly, the host should be configured first. If there's no
good sandbox for Chrome to use, it will crash with the error
`No usable sandbox!`.

If you **absolutely trust** the content you open in Chrome, you can launch
Chrome with the `--no-sandbox` argument:

```ts
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

:::caution

Running without a sandbox is **strongly discouraged**. Consider configuring a
sandbox instead.

:::

There are 2 ways to configure a sandbox in Chromium.

### [recommended] Enable [user namespace cloning](http://man7.org/linux/man-pages/man7/user_namespaces.7.html)

User namespace cloning is only supported by modern kernels. Unprivileged user
namespaces are generally fine to enable, but in some cases they open up more
kernel attack surface for (unsandboxed) non-root processes to elevate to kernel
privileges.

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

### [alternative] Setup [setuid sandbox](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/suid_sandbox_development.md)

The setuid sandbox comes as a standalone executable and is located next to the
Chrome that Puppeteer downloads. It is fine to re-use the same sandbox
executable for different Chrome versions, so the following could be done only
once per host environment:

```bash
# cd to Puppeteer cache directory (adjust the path if using a different cache directory).
cd ~/.cache/puppeteer/chrome/linux-<version>/chrome-linux64/
sudo chown root:root chrome_sandbox
sudo chmod 4755 chrome_sandbox
# copy sandbox executable to a shared location
sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox
# export CHROME_DEVEL_SANDBOX env variable
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```

You might want to export the `CHROME_DEVEL_SANDBOX` env variable by default. In
this case, add the following to the `~/.bashrc` or `.zshenv`:

```bash
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```

or to your `Dockerfile`:

```
ENV CHROME_DEVEL_SANDBOX /usr/local/sbin/chrome-devel-sandbox
```

## Running Puppeteer on Travis CI

> 👋 We ran our tests for Puppeteer on Travis CI until v6.0.0 (when we've
> migrated to GitHub Actions) - see our historical
> [`.travis.yml` (v5.5.0)](https://github.com/puppeteer/puppeteer/blob/v5.5.0/.travis.yml)
> for reference.

Tips-n-tricks:

- [xvfb](https://en.wikipedia.org/wiki/Xvfb) service should be launched in order
  to run Chromium in non-headless mode
- Runs on Xenial Linux on Travis by default
- Runs `npm install` by default
- `node_modules` is cached by default

`.travis.yml` might look like this:

```yml
language: node_js
node_js: node
services: xvfb
script:
  - npm test
```

## Running Puppeteer on WSL (Windows subsystem for Linux)

See [this thread](https://github.com/puppeteer/puppeteer/issues/1837) with some
tips specific to WSL. In a nutshell, you need to install missing dependencies by
either:

1. [Installing Chrome on WSL to install all dependencies](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps#install-google-chrome-for-linux)
2. Installing required dependencies manually:
   `sudo apt install libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2`.

:::caution

The list of required dependencies might get outdated and depend on what you
already have installed.

:::

## Running Puppeteer on CircleCI

Running Puppeteer smoothly on CircleCI requires the following steps:

1. Start with a
   [NodeJS image](https://circleci.com/docs/2.0/circleci-images/#nodejs) in your
   config like so:
   ```yaml
   docker:
     - image: circleci/node:14 # Use your desired version
       environment:
         NODE_ENV: development # Only needed if puppeteer is in `devDependencies`
   ```
1. Dependencies like `libXtst6` probably need to be installed via `apt-get`, so
   use the
   [threetreeslight/puppeteer](https://circleci.com/orbs/registry/orb/threetreeslight/puppeteer)
   orb
   ([instructions](https://circleci.com/orbs/registry/orb/threetreeslight/puppeteer#quick-start)),
   or paste parts of its
   [source](https://circleci.com/orbs/registry/orb/threetreeslight/puppeteer#orb-source)
   into your own config.
1. Lastly, if you’re using Puppeteer through Jest, then you may encounter an
   error spawning child processes:
   ```
   [00:00.0]  jest args: --e2e --spec --max-workers=36
   Error: spawn ENOMEM
      at ChildProcess.spawn (internal/child_process.js:394:11)
   ```
   This is likely caused by Jest autodetecting the number of processes on the
   entire machine (`36`) rather than the number allowed to your container (`2`).
   To fix this, set `jest --maxWorkers=2` in your test command.

## Running Puppeteer in Docker

> 👋 We used [Cirrus Ci](https://cirrus-ci.org/) to run our tests for Puppeteer
> in a Docker container until v3.0.x - see our historical
> [`Dockerfile.linux` (v3.0.1)](https://github.com/puppeteer/puppeteer/blob/v3.0.1/.ci/node12/Dockerfile.linux)
> for reference. Starting from v16.0.0 we are shipping a Docker image via the
> GitHub registry. The Dockerfile is located
> [here](https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile) and
> the usage instructions are in the
> [README.md](https://github.com/puppeteer/puppeteer#running-in-docker). The
> instructions below might be still helpful if you are building your own image.

Getting headless Chrome up and running in Docker can be tricky. The bundled
Chromium that Puppeteer installs is missing the necessary shared library
dependencies.

To fix, you'll need to install the missing dependencies and the latest Chromium
package in your Dockerfile:

```Dockerfile
FROM node:14-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# uncomment the following lines to have `dumb-init` as PID 1
# ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
# RUN chmod +x /usr/local/bin/dumb-init
# ENTRYPOINT ["dumb-init", "--"]

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-stable'})
# ENV PUPPETEER_SKIP_DOWNLOAD true

# Install puppeteer so it's available in the container.
RUN npm init -y &&  \
    npm i puppeteer \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /node_modules \
    && chown -R pptruser:pptruser /package.json \
    && chown -R pptruser:pptruser /package-lock.json

# Run everything after as non-privileged user.
USER pptruser

CMD ["google-chrome-stable"]
```

Build the container:

```bash
docker build -t puppeteer-chrome-linux .
```

Run the container by passing `node -e "<yourscript.js content as a string>"` as
the command:

```bash
 docker run -i --init --rm --cap-add=SYS_ADMIN \
   --name puppeteer-chrome puppeteer-chrome-linux \
   node -e "`cat yourscript.js`"
```

There's a full example at https://github.com/ebidel/try-puppeteer that shows how
to run this Dockerfile from a webserver running on App Engine Flex (Node).

### Running on Alpine

The
[newest Chromium package](https://pkgs.alpinelinux.org/package/edge/community/x86_64/chromium)
supported on Alpine is 100, which corresponds to
[Puppeteer v13.5.0](https://github.com/puppeteer/puppeteer/releases/tag/v13.5.0).

Example Dockerfile:

```Dockerfile
FROM alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

...

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer v13.5.0 works with Chromium 100.
RUN yarn add puppeteer@13.5.0

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

...
```

## Running Puppeteer on GitlabCI

This is very similar to some of the instructions above, but require a bit
different configuration to finally achieve success.

Usually the issue looks like this:

```bash
Error: Failed to launch chrome! spawn /usr/bin/chromium-browser ENOENT
```

You need to patch two places:

1. Your `gitlab-ci.yml` config
2. Arguments' list when launching puppeteer

In `gitlab-ci.yml` we need to install some packages to make it possible to
launch headless Chrome in your docker env:

```yml
before_script:
  - apt-get update
  - apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1
    libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release
    xdg-utils wget
```

Next, you have to use `'--no-sandbox'` mode and also
`'--disable-setuid-sandbox'` when launching Puppeteer. This can be done by
passing them as an arguments to your `.launch()` call:
`puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });`.

## Running Puppeteer on Google Cloud Run

Google Cloud Run disables the CPU by default, after an HTTP response is written to the client. This means that puppeteer will appear extremely slow (taking 1-5 minutes to launch), if you "run puppeteer in the background" after your response has been written.

So this simple express app will be percievably slow:

```js
import express from 'express';

const app = express();

app.post('/test-puppeteer', (req, res) => {
  res.json({
    jobId: 123,
    acknowledged: true,
  });

  puppeteer.launch().then(browser => {
    // 2 minutes later...
  });
});

app.listen(3000);
```

It is slow because CPU is disabled on GCR because puppeteer is launched after the response is sent. What you want to do is this:

```js
app.post('/test-puppeteer', (req, res) => {
  puppeteer.launch().then(browser => {
    // A second later...
    res.json({
      jobId: 123,
      acknowledged: true,
    });
  });
});
```

If you want to run the stuff in the background, you need to "enable CPU always" even after responses are sent. That should fix it.

#### Tips

By default, Docker runs a container with a `/dev/shm` shared memory space 64MB.
This is [typically too small](https://github.com/c0b/chrome-in-docker/issues/1)
for Chrome and will cause Chrome to crash when rendering large pages. To fix,
run the container with `docker run --shm-size=1gb` to increase the size of
`/dev/shm`. Since Chrome 65, this is no longer necessary. Instead, launch the
browser with the `--disable-dev-shm-usage` flag:

```ts
const browser = await puppeteer.launch({
  args: ['--disable-dev-shm-usage'],
});
```

This will write shared memory files into `/tmp` instead of `/dev/shm`. See
[crbug.com/736452](https://bugs.chromium.org/p/chromium/issues/detail?id=736452)
for more details.

Seeing other weird errors when launching Chrome? Try running your container with
`docker run --cap-add=SYS_ADMIN` when developing locally. Since the Dockerfile
adds a `pptr` user as a non-privileged user, it may not have all the necessary
privileges.

[dumb-init](https://github.com/Yelp/dumb-init) is worth checking out if you're
experiencing a lot of zombies Chrome processes sticking around. There's special
treatment for processes with PID=1, which makes it hard to terminate Chrome
properly in some cases (e.g. in Docker).

## Running Puppeteer in the cloud

### Running Puppeteer on Google App Engine

The Node.js runtime of the
[App Engine standard environment](https://cloud.google.com/appengine/docs/standard/nodejs/)
comes with all system packages needed to run Headless Chrome.

To use `puppeteer`, specify the module as a dependency in your `package.json`
and then override the puppeteer cache directory by including a file named
`.puppeteerrc.cjs` at the root of your application with the contents:

```ts
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};
```

> [!NOTE]
> Google App Engine caches your `node_modules` between builds.
> Specifying the Puppeteer cache as subdirectory of `node_modules`
> mitigates an issue in which Puppeteer can't find the browser executable
> due to `postinstall` not being run.

### Running Puppeteer on Google Cloud Functions

The Node.js runtime of
[Google Cloud Functions](https://cloud.google.com/functions/docs/)
comes with all system packages needed to run Headless Chrome.

To use `puppeteer`, specify the module as a dependency in your `package.json`
and then override the puppeteer cache directory by including a file named
`.puppeteerrc.cjs` at the root of your application with the contents:

```ts
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};
```

> [!NOTE]
> Google Cloud Functions caches your `node_modules` between builds. Specifying the
> puppeteer cache as subdirectory of `node_modules` mitigates an issue in which the
> puppeteer install process does not run when the cache is hit.

### Running Puppeteer on Google Cloud Run

The default Node.js runtime of
[Google Cloud Run](https://cloud.google.com/run/docs/) does not come with the
system packages needed to run Headless Chrome. You will need to set up your own
`Dockerfile` and
[include the missing dependencies](#chrome-doesnt-launch-on-linux).

### Running Puppeteer on Heroku

Running Puppeteer on Heroku requires some additional dependencies that aren't
included on the Linux box that Heroku spins up for you. To add the dependencies
on deploy, add the Puppeteer Heroku buildpack to the list of buildpacks for your
app under Settings > Buildpacks.

The url for the buildpack is
https://github.com/jontewks/puppeteer-heroku-buildpack

Ensure that you're using `'--no-sandbox'` mode when launching Puppeteer. This
can be done by passing it as an argument to your `.launch()` call:
`puppeteer.launch({ args: ['--no-sandbox'] });`.

When you click add buildpack, simply paste that url into the input, and click
save. On the next deploy, your app will also install the dependencies that
Puppeteer needs to run.

If you need to render Chinese, Japanese, or Korean characters you may need to
use a buildpack with additional font files like
https://github.com/CoffeeAndCode/puppeteer-heroku-buildpack

There's also another
[simple guide](https://timleland.com/headless-chrome-on-heroku/) from @timleland
that includes a sample project:
https://timleland.com/headless-chrome-on-heroku/.

### Running Puppeteer on AWS Lambda

AWS Lambda [limits](https://docs.aws.amazon.com/lambda/latest/dg/limits.html)
deployment package sizes to ~50MB. This presents challenges for running headless
Chrome (and therefore Puppeteer) on Lambda. The community has put together a few
resources that work around the issues:

- https://github.com/sparticuz/chromium (a vendor and framework agnostic library that supports modern versions of `chromium`)
- https://github.com/alixaxel/chrome-aws-lambda (supports up to puppeteer 10.1 - outdated)
- https://github.com/adieuadieu/serverless-chrome/blob/HEAD/docs/chrome.md
  (serverless plugin - outdated)

### Running Puppeteer on AWS EC2 instance running Amazon-Linux

If you are using an EC2 instance running amazon-linux in your CI/CD pipeline,
and if you want to run Puppeteer tests in amazon-linux, follow these steps.

1. To install Chromium, you have to first enable `amazon-linux-extras` which
   comes as part of
   [EPEL (Extra Packages for Enterprise Linux)](https://aws.amazon.com/premiumsupport/knowledge-center/ec2-enable-epel/):

   ```bash
   sudo amazon-linux-extras install epel -y
   ```

1. Next, install Chromium:

   ```bash
   sudo yum install -y chromium
   ```

Now Puppeteer can launch Chromium to run your tests. If you do not enable EPEL
and if you continue installing chromium as part of `npm install`, Puppeteer
cannot launch Chromium due to unavailability of `libatk-1.0.so.0` and many more
packages.

## Code Transpilation Issues

If you are using a JavaScript transpiler like babel or TypeScript, calling
`evaluate()` with an async function might not work. This is because while
`puppeteer` uses `Function.prototype.toString()` to serialize functions while
transpilers could be changing the output code in such a way it's incompatible
with `puppeteer`.

Some workarounds to this problem would be to instruct the transpiler not to mess
up with the code, for example, configure TypeScript to use latest ecma version
(`"target": "es2018"`). Another workaround could be using string templates
instead of functions:

```ts
await page.evaluate(`(async() => {
   console.log('1');
})()`);
```
