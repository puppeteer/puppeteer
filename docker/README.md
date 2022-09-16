# Dockerfile for Puppeteer

This directory contains files needed to containerize Puppeteer. The major problem
that this is solving is the problem of providing all dependencies required to run a
browser instance.

## Building the image

```sh
docker build -t puppeteer-chrome-linux . # `puppeteer-chrome-linux` is the name of the image.
```

## Running the image

```sh
docker run -i --init --cap-add=SYS_ADMIN --rm ghcr.io/puppeteer/puppeteer:latest node -e "`cat docker/test/smoke-test.js`"
```

`--cap-add=SYS_ADMIN` capability is needed to enable Chromium sandbox that makes the browser more secure. Alternatively, it should be possible to start the browser binary with the `--no-sandbox` flag.

## GitHub Actions

The image is automatically built, tested, and published by the [publish-docker.yml](https://github.com/puppeteer/puppeteer/blob/main/.github/workflows/publish-docker.yml) workflow.
