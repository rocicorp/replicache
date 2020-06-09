ORIG=`pwd`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../
REPM_VERSION='7dc06be02dc06caf8f91b26ad06c7f9f4d9bfb1b'

echo "Building repm..."

(
  cd $ROOT
  set -x

  rm -rf out.repm
  mkdir out.repm
  cd out.repm


  # Build repm
  git clone https://github.com/rocicorp/replicache-client
  cd replicache-client
  git reset --hard $REPM_VERSION
  GOARCH=amd64 GOOS=darwin go build -o ../repm-amd64-osx ./cmd/test_server
  GOARCH=amd64 GOOS=linux go build -o ../repm-amd64-linux ./cmd/test_server
)
