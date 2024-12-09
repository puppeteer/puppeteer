# @puppeteer/browsers

Manage and launch browsers/drivers from a CLI or programmatically.

## CLI

Use `npx` to run the CLI:

```bash
# This will install and run the @puppeteer/browsers package.
# If it is already installed in the current directory, the installed
# version will be used.
npx @puppeteer/browsers --help
```

Built-in per-command `help` will provide all documentation you need to use the CLI.

```bash
npx @puppeteer/browsers --help # help for all commands
npx @puppeteer/browsers install --help # help for the install command
npx @puppeteer/browsers launch --help # help for the launch command
npx @puppeteer/browsers clear --help # help for the clear command
npx @puppeteer/browsers list --help # help for the list command
```

You can specify the version of the `@puppeteer/browsers` when using
`npx`:

```bash
# Always install and use the latest version from the registry.
npx @puppeteer/browsers@latest --help
# Always use a specifc version.
npx @puppeteer/browsers@2.4.1 --help
# Always install the latest version and automatically confirm the installation.
npx --yes @puppeteer/browsers@latest --help
```

To clear all installed browsers, use the `clear` command:

```bash
npx @puppeteer/browsers clear
```

To list all installed browsers, use the `list` command:

```bash
npx @puppeteer/browsers list
```

Some example to give an idea of what the CLI looks like (use the `--help` command for more examples):

```sh
# Download the latest available Chrome for Testing binary corresponding to the Stable channel.
npx @puppeteer/browsers install chrome@stable

# Download a specific Chrome for Testing version.
npx @puppeteer/browsers install chrome@116.0.5793.0

# Download the latest Chrome for Testing version for the given milestone.
npx @puppeteer/browsers install chrome@117

# Download the latest available ChromeDriver version corresponding to the Canary channel.
npx @puppeteer/browsers install chromedriver@canary

# Download a specific ChromeDriver version.
npx @puppeteer/browsers install chromedriver@116.0.5793.0
```

## Known limitations

1. Launching the system browsers is only possible for Chrome/Chromium.

## API

The programmatic API allows installing and launching browsers from your code. See the `test` folder for examples on how to use the `install`, `canInstall`, `launch`, `computeExecutablePath`, `computeSystemExecutablePath` and other methods.
