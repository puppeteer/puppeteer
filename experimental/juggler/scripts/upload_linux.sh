set -e

if [ -e ./FIREFOX_SHA ]; then
  echo Checking Juggler root - OK
else
  echo Please run this script from the Juggler root
  exit 1;
fi
cd firefox/obj-x86_64-pc-linux-gnu/dist/
zip -r firefox-linux.zip firefox
mv firefox-linux.zip ../../../
cd -
gsutil mv firefox-linux.zip gs://juggler-builds/$(git rev-parse HEAD)/
