# Juggler

> Juggler - Firefox Automation Protocol for implementing the Puppeteer API.

## Protocol

See [`//src/Protocol.js`](https://github.com/GoogleChrome/puppeteer/blob/master/experimental/juggler/src/Protocol.js).

## Building FF with Juggler

1. Clone Juggler repository
```bash
git clone https://github.com/aslushnikov/juggler
cd juggler
```

2. Checkout [pinned Firefox revision](https://github.com/aslushnikov/juggler/blob/master/FIREFOX_SHA) from mozilla [github mirror](https://github.com/mozilla/gecko-dev) into `//firefox` folder.

```bash
SOURCE=$PWD bash scripts/fetch_firefox.sh
```

3. Apply juggler patches to Firefox source code

```bash
cd firefox
git am ../patches/*
ln -s $PWD/../src $PWD/testing/juggler
```

4. Bootstrap host environment for Firefox build and compile firefox locally

```bash
# OPTIONAL - bootstrap host environment.
./mach bootstrap --application-choice=browser --no-interactive
# Compile browser
./mach build
```

### Troubleshooting when building FF on Mac
#### Black screen after FF Build
As of Jan. 2019 there is a known [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1493330) that will cause an entirely black screen when running the nightly build of firefox built with the **MacOSX SDK version 10.14.**

The easiest fix right now is downgrading your MacOSX SDK.

To do so:

1) Go to [this repo](https://github.com/phracker/MacOSX-SDKs) and install any **SDK version < 10.14** (e.g. 10.13 works fine)

2) In the `juggler/firefox` folder:

```bash
echo "ac_add_options --with-macos-sdk=path/to/sdk" >> .mozconfig
# your SDK might be located at
# /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/
```

3) run `./mach build` again


#### Missing headers in /usr/include
On MacOS 10.14 (Mojave) you might run into issues when building FF.

The error is related to [a change in the xcode-select installation](https://bugzilla.mozilla.org/show_bug.cgi?id=1487552)

To workaround this issue you can simply run:

```bash
# Write missing headers to /usr/include
sudo installer -pkg /Library/Developer/CommandLineTools/Packages/macOS_SDK_headers_for_macOS_10.14.pkg -target /
```

## Running Firefox with Juggler

Juggle adds a `-juggler` CLI flag that accepts a port to expose a remote protocol on.
Pass `0` to pick a random port - Juggler will print its port to STDOUT.

```
./mach run -- -juggler 0
```

## Uploading builds to Google Storage

Firefox builds with Juggler support are uploaded to gs://juggler-builds/ bucket.

Project maintainers can upload builds.
To upload a build, do the following:

1. Install [gcloud](https://cloud.google.com/sdk/install) if you haven't yet.
2. Authenticate in the cloud and select project

```bash
gcloud auth login
gcloud config set project juggler-builds
```

3. Make sure **firefox is compiled**; after that, package a build for a redistribution:

```bash
cd firefox
./mach package
```

4. Archive build and copy to the gbucket

We want to ship `*.zip` archives so that it's easy to decompress them on the node-side.

- Linux: `./scripts/upload_linux.sh`
- Mac: `./scripts/upload_mac.sh`

