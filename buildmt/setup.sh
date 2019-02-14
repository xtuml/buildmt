#!/bin/bash

# This script is intended for Jenkins user specific configuration. It is
# designed to be executed by the "jenkins" user. It is executed automatically
# when the Jenkins server starts on bootup. It can be safely re-run at any time
# by the "jenkins" user.

echo "Setting up build server at: $(date)"

# go to the buildmt directory
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# install package dependencies
cd $DIR
sudo bash install-package-dependencies.sh

# configure vnc server
printf "newpass\nnewpass\n\n" | vnc4passwd

# configure xrdp
cd $DIR
if [ ! -e ~/.xsession ]; then
    sudo /etc/init.d/xrdp stop
    echo "xfce4-session" > ~/.xsession
    echo "xterm*faceName: DejaVu Snas Mono Book" > ~/.Xresources
    echo "xterm*faceSize: 11" >> ~/.Xresources
    xrdb -merge ~/.Xresources
    TMPFILE=`mktemp`
    awk -v found1=0 -v found2=0 '/\[Xvnc\]/{found1=1;}; /^$/{if (found1 && !found2) {found2=1;print "param=-SecurityTypes\nparam=None";}}; //{print $0;}' /etc/xrdp/sesman.ini > $TMPFILE
    sudo cp $TMPFILE /etc/xrdp/sesman.ini
    xvfb-run bash start-xfce.sh
    TMPFILE=`mktemp`
    sed '/switch_window_key/d' ~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-keyboard-shortcuts.xml > $TMPFILE
    cp $TMPFILE ~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-keyboard-shortcuts.xml
    echo $TMPFILE
    sudo /etc/init.d/xrdp restart
fi

# install bridgepoint
cd $DIR
if [ "" = "$BP_BUILD_LOCATION" ]; then
  BP_BUILD_LOCATION="nightly-build"
fi
if [ ! -e BridgePoint/bridgepoint ]; then
    mkdir -p BridgePoint
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

# get the cli
cd $DIR
if [ ! -e jenkins-cli.jar ]; then
    cp /var/cache/jenkins/war/WEB-INF/jenkins-cli.jar .
fi

# install plugins
cd $DIR/jenkins-home
while read p; do
  bash install-jenkins-plugin.sh $p
done < plugins.txt

echo "Build server setup complete at: $(date)"
