ORIG=`pwd`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../

DIFFS_VERSION='a99baedd298425ab933e2c0cb62c0b393b371161'
REPM_VERSION='348828de6b411421ab377a1eed224d19d0a76600'
FLUTTER_VERSION='3f31456d9390eab8f8eef2b63ba96b18b41217ba'

cd $ROOT
rm -rf build
mkdir build
cd build

echo "Building diffs..."
git clone https://github.com/rocicorp/diff-server
cd diff-server
git reset --hard $DIFFS_VERSION
GOOS=darwin GOARCH=amd64 go build -ldflags "-X roci.dev/diff-server/util/version.v=$DIFFS_VERSION" -o ../out/darwin-amd64/diffs ./cmd/diffs
GOOS=linux GOARCH=amd64 go build -ldflags "-X roci.dev/diff-server/util/version.v=$DIFFS_VERSION" -o ../out/linux-amd64/diffs ./cmd/diffs

echo ""
echo "Building noms..."
NOMS_VERSION=`go mod graph | grep '^github.com/attic-labs/noms@' | cut -d' ' -f1 | head -n1`
go get $NOMS_VERSION
GOOS=darwin GOARCH=amd64 go build -o ../out/darwin-amd64/noms github.com/attic-labs/noms/cmd/noms
GOOS=linux GOARCH=amd64 go build -o ../out/linux-amd64/noms github.com/attic-labs/noms/cmd/noms
cd ..

echo ""
echo "Building repm..."
git clone https://github.com/rocicorp/replicache-client
cd replicache-client
git reset --hard $REPM_VERSION
./build.sh

# repl
echo ""
echo "Building repl..."
GOOS=darwin GOARCH=amd64 go build -ldflags "-X roci.dev/diff-server/util/version.v=$REPM_VERSION" -o ../out/darwin-amd64/repl ./cmd/repl
GOOS=linux GOARCH=amd64 go build -ldflags "-X roci.dev/diff-server/util/version.v=$REPM_VERSION" -o ../out/linux-amd64/repl ./cmd/repl
cd ..

echo ""
echo "Building Flutter Package..."
git clone https://github.com/rocicorp/replicache-sdk-flutter
cd replicache-sdk-flutter
git reset --hard $FLUTTER_VERSION
cp -R ../replicache-client/build/Repm.framework ios/
cp ../replicache-client/build/repm.aar android/
tool/build.sh
cp -R build/replicache-flutter-sdk ../out/flutter
cd ..

mv out replicache-sdk
tar -czvf replicache-sdk.tar.gz replicache-sdk

cd $ORIG
