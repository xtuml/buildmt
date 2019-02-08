#!/bin/bash

echo "Setting up build server at: $(date)"

# go to the buildmt directory
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# install package dependencies
cd $DIR
sudo bash get-package-dependencies.sh

# configure vncserver
printf "newpass\nnewpass\n\n" | vncpasswd

# install bridgepoint
cd $DIR
if [ "" = "$BP_BUILD_LOCATION" ]; then
  BP_BUILD_LOCATION="nightly-build"
fi
if [ ! -e BridgePoint/bridgepoint ]; then
    wget http://s3.amazonaws.com/xtuml-releases/$BP_BUILD_LOCATION/org.xtuml.bp.product-linux.gtk.x86_64.zip
    unzip -q org.xtuml.bp.product-linux.gtk.x86_64.zip
    mv org.xtuml.bp.product-linux.gtk.x86_64.zip BridgePoint
    TMPFILE=`mktemp`
    sed '/WORKSPACE2/b; s/WORKSPACE/WORKSPACE2/g' BridgePoint/tools/mc/bin/CLI.sh > $TMPFILE
    cp $TMPFILE BridgePoint/tools/mc/bin/CLI.sh
    chmod +x BridgePoint/tools/mc/bin/CLI.sh
    sed '/WORKSPACE2/b; s/WORKSPACE/WORKSPACE2/g' BridgePoint/tools/mc/bin/launch-cli.py > $TMPFILE
    cp $TMPFILE BridgePoint/tools/mc/bin/launch-cli.py
fi

# install osxcross
cd $DIR
MACOS_SDK=MacOSX10.11.sdk.tar.xz
if [[ ! -e osxcross && -e $MACOS_SDK ]]; then
    git clone https://github.com/tpoechtrager/osxcross.git --depth 1
    mv $MACOS_SDK osxcross/tarballs
    cd osxcross
    TMPFILE=`mktemp`
    sed 's/OSX_VERSION_MIN=10.5/OSX_VERSION_MIN=10.11/g' build.sh > $TMPFILE
    cp $TMPFILE build.sh
    export UNATTENDED=1
    ./build.sh
fi

# download the cli
cd $DIR
if [ ! -e jenkins-cli.jar ]; then
    wget http://localhost:8080/jnlpJars/jenkins-cli.jar
fi

# install plugins
cd $DIR/jenkins-home
while read p; do
  bash install-jenkins-plugin.sh $p
done < plugins.txt

echo "Build server setup complete at: $(date)"
