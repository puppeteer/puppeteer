#!/bin/bash

VALUE=$(cat /boot/config-$(uname -r) | grep CONFIG_USER_NS)

if [[ -z "$VALUE" ]]
then
  echo 'You do not have namespacing in the kernel. You will need to enable the SUID sandbox or upgrade your kernel.'
  echo 'See https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md'
  exit 1
fi

USER_NS_AVAILABLE="${VALUE: -1}"

if [[ "$USER_NS_AVAILABLE" == "y" ]]
then
  exit 0
else
  echo 'You do not have namespacing in the kernel. You will need to enable the SUID sandbox or upgrade your kernel.'
  echo 'See https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md'
  exit 1
fi
