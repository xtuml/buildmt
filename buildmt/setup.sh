#!/bin/bash

# go to the buildmt directory
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# install package dependencies
cd $DIR
bash get_package_dependencies.sh

# configure vncserver
/etc/init.d/jenkins stop
usermod -d $DIR/jenkins-home jenkins
chown -R jenkins $DIR/jenkins-home
su jenkins -c 'printf "newpass\nnewpass\n\n" | vncpasswd'

# install bridgepoint
cd $DIR
wget https://s3.amazonaws.com/xtuml-releases/release-build/201703301540_v6.2.4/BridgePoint_v6.2.4-linux.gtk.x86_64.zip
unzip BridgePoint_v6.2.4-linux.gtk.x86_64.zip
TMPFILE=`mktemp`
sed 's/WORKSPACE/WORKSPACE2/g' BridgePoint/tools/mc/bin/CLI.sh > $TMPFILE
mv $TMPFILE BridgePoint/tools/mc/bin/CLI.sh
chmod +x BridgePoint/tools/mc/bin/CLI.sh

# install plugins
cd $DIR/jenkins-home
while read p; do
  bash install_jenkins_plugin.sh $p
done < plugins.txt
