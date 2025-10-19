FROM node:25@sha256:92a8086f817cfaf95bfca41d2f72382ae64e87389fe865f9b2f06335edb34073

# Configure default locale (important for chrome-headless-shell).
ENV LANG=en_US.UTF-8 
# UID of the non-root user 'pptruser'
ENV PPTRUSER_UID=10042
# Attempts to start a new DBUS session if none is present
ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
    fonts-kacst fonts-freefont-ttf dbus dbus-x11

# Add pptruser.
RUN groupadd -r pptruser && useradd -u $PPTRUSER_UID -rm -g pptruser -G audio,video pptruser

USER $PPTRUSER_UID

WORKDIR /home/pptruser

COPY puppeteer-browsers-latest.tgz puppeteer-latest.tgz puppeteer-core-latest.tgz ./


# Install @puppeteer/browsers, puppeteer and puppeteer-core into /home/pptruser/node_modules.
RUN npm i ./puppeteer-browsers-latest.tgz ./puppeteer-core-latest.tgz ./puppeteer-latest.tgz \
    && rm ./puppeteer-browsers-latest.tgz ./puppeteer-core-latest.tgz ./puppeteer-latest.tgz

# Install system dependencies as root.
USER root
# Overriding the cache directory to install the deps for the Chrome
# version installed for pptruser. 
RUN PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer \
    npx puppeteer browsers install chrome --install-deps

USER $PPTRUSER_UID
# Generate THIRD_PARTY_NOTICES using chrome --credits.
RUN node -e "require('child_process').execSync(require('puppeteer').executablePath() + ' --credits', {stdio: 'inherit'})" > THIRD_PARTY_NOTICES
