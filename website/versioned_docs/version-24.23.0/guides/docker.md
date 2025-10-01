# Docker

Puppeteer offers a Docker image that includes [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) along with the required
dependencies and a pre-installed Puppeteer version. The image is available via
the
[GitHub Container Registry](https://github.com/puppeteer/puppeteer/pkgs/container/puppeteer).
The latest image is tagged as `latest` and other tags match Puppeteer versions.
For example,

```bash
docker pull ghcr.io/puppeteer/puppeteer:latest # pulls the latest
docker pull ghcr.io/puppeteer/puppeteer:16.1.0 # pulls the image that contains Puppeteer v16.1.0
```

The image is meant for running the browser in sandbox mode and therefore,
running the image requires the `SYS_ADMIN` capability.

## Usage

To use the docker image directly, run:

```bash
docker run -i --init --cap-add=SYS_ADMIN --rm ghcr.io/puppeteer/puppeteer:latest node -e "$(cat path/to/script.js)"
```

where `path/to/script.js` is the path relative to your working directory. Note
the image requires the `SYS_ADMIN` capability since the browser runs in sandbox
mode.

If you need to build an image based on a different base image, you can use our
[`Dockerfile`](https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile)
as the starting point.

:::caution

Make sure to specify a init process via the `--init` flag or a custom `ENTRYPOINT`
to make sure all processes started by Puppeteer are managed properly.

:::

## dbus

The image installs and configures dbus for Chrome. Usually you would not
need dbus in the headless mode but you might see warnings in the browser
console. You can start the dbus service before launching
your application:

```
sudo service dbus start
```

See https://docs.docker.com/config/containers/multi-service_container/
for instructions how to start multiple processes in a container.
