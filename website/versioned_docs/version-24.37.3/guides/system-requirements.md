# System requirements

- Node 18+. Puppeteer follows the latest
  [maintenance LTS](https://github.com/nodejs/Release#release-schedule) version of
  Node

- TypeScript 4.7.4+ (If used with TypeScript).
  - Target ES2022 or later if you [type check node_modules](https://www.typescriptlang.org/tsconfig/#skipLibCheck).

- Chrome for Testing browser system requirements:
  - [Windows](https://support.google.com/chrome/a/answer/7100626?hl=en#:~:text=the%20specified%20criteria.-,Windows,-To%20use%20Chrome), x64 architecture
  - [MacOS](https://support.google.com/chrome/a/answer/7100626?hl=en#:~:text=Not%20yet%20scheduled-,Mac,-To%20use%20Chrome), x64 and arm64 architectures
  - [Debian/Ubuntu Linux](https://support.google.com/chrome/a/answer/7100626?hl=en#:~:text=10.15%20or%20later-,Linux,-To%20use%20Chrome), with x64 architecture
    - Required system packages https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/debian/dist_package_versions.json
  - [openSUSE/Fedora Linux](https://support.google.com/chrome/a/answer/7100626?hl=en#:~:text=10.15%20or%20later-,Linux,-To%20use%20Chrome), with x64 architecture
    - Required system packages https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/rpm/dist_package_provides.json

- Firefox browser system requirements:
  - https://www.mozilla.org/en-US/firefox/system-requirements/
  - The `xz` or `bzip2` utilities are required to unpack Firefox versions for Linux.
