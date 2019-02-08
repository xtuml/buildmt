#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR
git reset --hard
git clean -df .
git pull
bash buildmt/setup.sh >> /var/log/jenkins/build_server_setup.log 2>&1
