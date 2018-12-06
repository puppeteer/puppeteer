set -e
set -x

if [ -d $SOURCE/firefox ]; then
  echo ERROR! Directory "${SOURCE}/firefox" exists. Remove it and re-run this script.
  exit 1;
fi
mkdir -p $SOURCE/firefox
cd $SOURCE/firefox
git init
git remote add origin https://github.com/mozilla/gecko-dev.git
git fetch --depth 50 origin release
git reset --hard $(cat $SOURCE/FIREFOX_SHA)
if [[ $? == 0 ]]; then
  echo SUCCESS
else
  echo FAILED TO CHECKOUT PINNED REVISION
fi
