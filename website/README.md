# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

Its dependencies are purposefully kept separate from the main Puppeteer codebase's in order to avoid having all our end users install them when installing Puppeteer. In the future we may move this website into its own repository.

## Installation

```console
npm install
```

## Local Development

```console
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
npm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Deploys are automatically handled by the `deploy-docs.yml` workflow.
