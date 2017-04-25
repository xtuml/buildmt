#!/bin/bash

# go to the buildmt directory
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# install package dependencies
cd $DIR
bash get-package-dependencies.sh

# configure vncserver
chown -R jenkins $DIR/jenkins-home
su jenkins -c 'printf "newpass\nnewpass\n\n" | vncpasswd'

# install bridgepoint
cd $DIR
wget http://s3.amazonaws.com/xtuml-releases/nightly-build/org.xtuml.bp.product-linux.gtk.x86_64.zip
unzip org.xtuml.bp.product-linux.gtk.x86_64.zip
mv org.xtuml.bp.product-linux.gtk.x86_64.zip BridgePoint
TMPFILE=`mktemp`
sed 's/WORKSPACE/WORKSPACE2/g' BridgePoint/tools/mc/bin/CLI.sh > $TMPFILE
mv $TMPFILE BridgePoint/tools/mc/bin/CLI.sh
chmod +x BridgePoint/tools/mc/bin/CLI.sh

# install plugins
cd $DIR/jenkins-home
while read p; do
  bash install-jenkins-plugin.sh $p
done < plugins.txt
