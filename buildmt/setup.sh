#!/bin/bash

# go to the buildmt directory
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# install package dependencies
cd $DIR
sudo ./get-package-dependencies.sh

# setup /etc/default/jenkins for email
TMPFILE=`mktemp`
sudo sed -r '/^JAVA_ARGS=.*-Dmail.*/b; s/^JAVA_ARGS="(.*)"/JAVA_ARGS="\1 -Xmx1024m -Dmail.smtp.starttls.enable=true"\nJENKINS_JAVA_OPTIONS="-Dmail.smtp.starttls.enable=true"/g' /etc/default/jenkins > $TMPFILE
sudo cp $TMPFILE /etc/default/jenkins

# configure vncserver
printf "newpass\nnewpass\n\n" | vncpasswd

# install bridgepoint
cd $DIR
if [ ! -e BridgePoint/bridgepoint ]; then
    wget http://s3.amazonaws.com/xtuml-releases/nightly-build/org.xtuml.bp.product-linux.gtk.x86_64.zip
    unzip org.xtuml.bp.product-linux.gtk.x86_64.zip
    mv org.xtuml.bp.product-linux.gtk.x86_64.zip BridgePoint
    TMPFILE=`mktemp`
    sed 's/WORKSPACE/WORKSPACE2/g' BridgePoint/tools/mc/bin/CLI.sh > $TMPFILE
    mv $TMPFILE BridgePoint/tools/mc/bin/CLI.sh
    chmod +x BridgePoint/tools/mc/bin/CLI.sh
fi

# download the cli
if [ ! -e jenkins-cli.jar ]; then
    wget http://localhost:8080/jnlpJars/jenkins-cli.jar
fi

# install plugins
cd $DIR/jenkins-home
while read p; do
  ./install-jenkins-plugin.sh $p
done < plugins.txt
