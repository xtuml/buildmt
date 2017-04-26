#!/bin/bash

# add build group and jenkins user
groupadd build
useradd -p `perl -e 'print crypt("password", "salt"),"\n"'` -g build jenkins
usermod -G sudo -a jenkins
echo "jenkins ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# install jenkins and git
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
apt-get update
apt-get install -y git jenkins
/etc/init.d/jenkins stop

# clone buildmt repo
mkdir temp-git
git clone https://github.com/leviathan747/buildmt.git --branch jenkins --depth 1 temp-git
mv temp-git/* .
mv temp-git/.[!.]* .
rm -rf temp-git
git config core.sharedRepository group

# set jenkins user home dir
usermod -d $PWD/buildmt/jenkins-home jenkins

# modify jenkins home
TMPFILE=`mktemp`
sed 's@^JENKINS_HOME=.*$@JENKINS_HOME='$PWD'/buildmt/jenkins-home@g' /etc/default/jenkins > $TMPFILE
cp $TMPFILE /etc/default/jenkins

# fixup permissions
chmod -R g+rw .
chown -R jenkins:build .
echo "umask 002" >> /etc/profile

# run setup
su jenkins -c 'bash buildmt/setup.sh'

# restart jenkins
/etc/init.d/jenkins restart
