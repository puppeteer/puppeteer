# auth
echo $GS_AUTH > $SOURCE/gsauth
# install gcloud sdk
curl https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.tar.gz > /tmp/google-cloud-sdk.tar.gz
mkdir -p $SOURCE/gcloud \
  && tar -C $SOURCE/gcloud -xvf /tmp/google-cloud-sdk.tar.gz \
  && CLOUDSDK_CORE_DISABLE_PROMPTS=1 $SOURCE/gcloud/google-cloud-sdk/install.sh
gcloud auth activate-service-account --key-file=$SOURCE/gsauth
gcloud config set project juggler-builds
