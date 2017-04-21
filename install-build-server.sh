#!/bin/bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
apt-get update
apt-get install -y git jenkins
git clone https://github.com/leviathan747/buildmt.git --branch jenkins .
chown -R jenkins .
TMPFILE=`mktemp`
sed 's@^JENKINS_HOME=.*$@JENKINS_HOME='$PWD'/buildmt/jenkins-home@g' /etc/default/jenkins > $TMPFILE
cp $TMPFILE /etc/default/jenkins
cd buildmt/jenkins-home
while read p; do
  bash install_jenkins_plugin.sh $p
done < plugins.txt
/etc/init.d/jenkins restart
