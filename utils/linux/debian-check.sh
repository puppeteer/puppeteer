#!/bin/bash

packages="gconf-service
libasound2
libatk1.0-0
libc6
libcairo2
libcups2
libdbus-1-3
libexpat1
libfontconfig1
libgcc1
libgconf-2-4
libgdk-pixbuf2.0-0
libglib2.0-0
libgtk-3-0
libnspr4
libpango-1.0-0
libpangocairo-1.0-0
libstdc++6
libx11-6
libx11-xcb1
libxcb1
libxcomposite1
libxcursor1
libxdamage1
libxext6
libxfixes3
libxi6
libxrandr2
libxrender1
libxss1
libxtst6
ca-certificates
fonts-liberation
libappindicator1
libnss3
lsb-release
xdg-utils
wget"

declare -a neededPackages

for packageName in $packages; do
  if ! dpkg-query -l "$packageName" > /dev/null 2>&1; then
    neededPackages[${#neededPackages[@]}]="$packageName"
  fi
done


neededCount=${#neededPackages[@]}

if [[ $neededCount -gt 0 ]]; then
  echo "-----------------------------------------------------"
  echo "Run the following to get all of the required packages"
  echo "-----------------------------------------------------"
  echo "sudo apt install \\"
  for i in "${neededPackages[@]}"; do
    output="$i"

     if [[ ${neededPackages[@]: -1 } != "$i" ]]; then
        output+=" \\"
     fi

    echo "$output"
  done
  echo "-----------------------------------------------------"
fi

exit 0
