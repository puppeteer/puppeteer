# Website

This website is built using [Docusaurus 3](https://docusaurus.io/).

### Installation

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command materializes the current documentation as `next`, materializes
the latest `puppeteer-v*` tag as the released documentation, and generates
static content into the `build` directory. Fetch Git tags before building.

In a shallow checkout, select an explicit source and version instead:

```
$ DOCS_RELEASE_REF=HEAD DOCS_RELEASE_VERSION=25.8.0 npm run build
```

The generated documentation inputs are ignored by Git.

### Deployment

Using SSH:

```
$ USE_SSH=true npm run deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
