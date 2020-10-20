#!/bin/sh

if [ -z "$1" ]
  then
    echo "Usage: ./bump.sh 0.10.1"
    exit
fi

DIR="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../

CHANGE_DATE=$(date +"%Y")-$(date +"%m")-$(date +"%d")

(
    perl -000 -n -i -e "s/version = \".*?\"/version = \"$1\"/m if /^\[package\]\n/; print;" Cargo.toml
    perl -p -i'' -e"s/(?<=Licensed Work:        repc ).*/$1/" licenses/BSL.txt
    perl -p -i'' -e"s/(?<=Change Date:          ).*/$CHANGE_DATE/" licenses/BSL.txt
)
