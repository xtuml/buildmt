#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR
# only update if the branch is master, otherwise a specific
# fork/branch is being used and is up to date
BRANCH=`git symbolic-ref --short -q HEAD`
if [[ "$BRANCH" == "master" ]]; then 
  git reset --hard
  git clean -df .
  git pull -f origin $BRANCH
fi
bash buildmt/setup.sh >> /var/log/jenkins/build_server_setup.log 2>&1
