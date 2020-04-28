ORIG=`pwd`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../

DIFFS_VERSION='bb7019cd467abb091e0733c3eb65014ab46b7c95'
REPM_VERSION='730e2302674ec0c97ba612496ae1d6a58af7072e'
FLUTTER_VERSION='d798e4b0ff3a64accb016176639351dbefc59c48'

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
