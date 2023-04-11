# @puppeteer/browsers

Manage and launch browsers/drivers from a CLI or programmatically.

## CLI

Use `npx` to run the CLI:

```sh
npx @puppeteer/browsers --help
```

CLI help will provide all documentation you need to use the CLI.

```sh
npx @puppeteer/browsers --help # help for all commands
npx @puppeteer/browsers install --help # help for the install command
npx @puppeteer/browsers launch --help # help for the launch command
```

## Known limitations

1. We support installing and running Firefox and Chrome/Chromium. The `latest` keyword only works during the installation. For the `launch` command you need to specify an exact build ID. The build ID is provided by the `install` command (see `npx @puppeteer/browsers install --help` for the format).
2. Launching the system browsers is only possible for Chrome/Chromium.

## API

The programmatic API allows installing and launching browsers from your code. See the `test` folder for examples on how to use the `install`, `canInstall`, `launch`, `computeExecutablePath`, `computeSystemExecutablePath` and other methods.
