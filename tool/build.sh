ORIG=`pwd`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../
REPM_VERSION='v0.9.0'

echo "Fetching test-server..."

(
  cd $ROOT
  set -x

  PLATFORM=''
  if [ "$(uname)" == "Darwin" ]; then
      PLATFORM='osx'
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
      PLATFORM='linux'
  else
    echo "Unsupported platform: $(uname)"
    exit
  fi

  URL="https://github.com/rocicorp/replicache-client/releases/download/$REPM_VERSION/test-server-amd64-$PLATFORM"
  curl -L -f $URL > test-server
  chmod u+x test-server
)
