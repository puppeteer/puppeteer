# Troubleshooting

## Running Puppeteer for Firefox on Travis CI

Tips-n-tricks:
- Use the [Xenial](https://docs.travis-ci.com/user/reference/xenial/) distribution
- The `libstdc++6` package from the `ubuntu-toolchain-r-test` repository must be installed in order to run Firefox on Ubuntu Xenial

To sum up, your `.travis.yml` might look like this:

```yml
language: node_js
dist: xenial
addons:
  apt:
    sources:
      - ubuntu-toolchain-r-test # if we don't specify this, the libstdc++6 we get is the wrong version
    packages:
      - libstdc++6
cache:
  directories:
    - node_modules
```
