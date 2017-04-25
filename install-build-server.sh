#!/bin/bash
useradd -p `perl -e 'print crypt("password", "salt"),"\n"'` jenkins
groupadd build
usermod -G build -a jenkins
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
apt-get update
apt-get install -y git jenkins
mkdir temp-git
git clone https://github.com/leviathan747/buildmt.git --branch jenkins --depth 1 temp-git
mv temp-git/* .
mv temp-git/.[!.]* .
rm -rf temp-git
TMPFILE=`mktemp`
sed 's@^JENKINS_HOME=.*$@JENKINS_HOME='$PWD'/buildmt/jenkins-home@g' /etc/default/jenkins > $TMPFILE
cp $TMPFILE /etc/default/jenkins
bash buildmt/setup.sh
chown -R jenkins:build .
/etc/init.d/jenkins restart
