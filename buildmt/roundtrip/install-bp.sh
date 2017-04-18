#/bin/bash

# variables
BUILDDIR=https://s3.amazonaws.com/xtuml-releases/nightly-build
BUILDFILES=$BUILDDIR/buildfiles.html
TMP_LOC=`mktemp`

INSTALL_DIR=/build/buildmt/roundtrip
TARGET=linux

# download buildfile html
wget -O $TMP_LOC $BUILDFILES &> /dev/null

# parse html
BUILD_INFO=(`python $INSTALL_DIR/parse-html.py $TARGET < $TMP_LOC`)
if [[ $? == 1 ]]; then
    echo "Problem parsing build files page"
    exit 1
fi
BUILD_ID=${BUILD_INFO[1]}
HREF=${BUILD_INFO[0]}

# check if already up to date
stat $INSTALL_DIR/$BUILD_ID &> /dev/null
if [[ $? == 1 ]]; then
    if [[ $1 == "check" ]]; then
        echo "New BridgePoint build: $BUILD_ID"
        exit 0
    fi

    # download build
    wget $BUILDDIR/$HREF

    # unzip build
    unzip -q $HREF

else
    echo "BridgePoint up to date. Current build: $BUILD_ID"
fi
