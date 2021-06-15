#!/bin/bash
ORIG=`pwd`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../
REPC_VERSION='v0.30.0'

(
  cd $ROOT

  PLATFORM=''
  if [ "$(uname)" == "Darwin" ]; then
      PLATFORM='osx'
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
      PLATFORM='linux'
  else
    echo "Unsupported platform: $(uname)"
    exit
  fi

  echo "Fetching repc..."
  mkdir -p bin
  URL="https://github.com/rocicorp/repc/releases/download/$REPC_VERSION/repc.zip"
  curl -L -f $URL > bin/repc.zip
  cd bin
  rm -rf repc
  unzip repc.zip
  mv pkg repc
  rm repc.zip
  
  cd ../src/
  rm -rf wasm
  ln -s ../bin/repc wasm
)
