---
name: puppeteer-verification
description: 'MANDATORY: Activate this skill ANY TIME you need to build the project, run tests, or verify code health in Puppeteer. You MUST use this skill before executing commands like npm test, npm run build, or linters, as it contains critical, repository-specific instructions on how to correctly format these commands, filter test runs, and interpret failures.'
---

# Instructions on how to verify your changes

## Testing

- To test a specific test ALWAYS add `.only` to the relevant test block, then run `npm run test:chrome:headless` for Chrome or `npm run test:firefox:headless` for Firefox.
- To run unit tests, use `npm run unit`.

## Building & compiling

- Check for build issues by running `npm run build`.

## Linting

- `npm run format` will execute linters and formatters. It will report any violations and automatically fix them where possible.

## Best practices

- Run tests often to verify your changes.
- Periodically build to check for errors.
