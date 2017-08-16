#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"$DIR"/namespace-check.sh

if [ -f "/etc/debian_version" ]; then
  echo "Checking Debian requirements"
  "$DIR"/debian-check.sh
fi
