#!/bin/bash

# This script is intended to use the Jenkins CLI to launch builds remotely.  It
# can be used at startup time using the AWS EC3 "user data" feature, and it can
# also be invoked remotely via SSH. A facility to update the host version of
# BridgePoint is included.

JOB=Build-BridgePoint

PARAMS=
JENKINS_USERNAME=
JENKINS_PASSWORD=
BP_INSTALL=

function printUsage {
  echo "Usage:"
  echo "  ./launch-build.sh --username <jenkins_username> --password <jenkins_password> [--installation <bp-installation-folder>]  [--buildfork <buildmt_fork>] [--buildbranch <buildmt_branch>] [--params ...]"
  exit 1
}

DIRECTIVE=
for i in $@; do
  case $i in
    "--username"|"--password"|"--installation"|"--buildfork"|"--buildbranch"|"--params")
      DIRECTIVE=$i
      ;;
    *)
      case $DIRECTIVE in
        "--username")
          if [[ "" == "$JENKINS_USERNAME" ]]; then
            JENKINS_USERNAME=$i
          else
            printUsage
          fi
          ;;
        "--password")
          if [[ "" == "$JENKINS_PASSWORD" ]]; then
            JENKINS_PASSWORD=$i
          else
            printUsage
          fi
          ;;
        "--installation")
          if [[ "" == "$BP_INSTALL" ]]; then
            BP_INSTALL=$i
          else
            printUsage
          fi
          ;;
        "--params")
          PARAMS="$PARAMS -p $i"
          ;;
        "--buildfork")
          BUILD_FORK=$i
          ;;
        "--buildbranch")
          BUILD_BRANCH=$i
          ;;
        *)
          echo "Printing usage: $i"
          printUsage
          ;;
      esac
      ;;
  esac
done

if [[ "" == "$JENKINS_USERNAME" || "" == "$JENKINS_PASSWORD" ]]; then
  printUsage
fi

# if a build fork/branch are specified
# update buildmt accordingly
if [ "" != "$BUILD_FORK" ] || [ "" != "$BUILD_BRANCH" ]; then
  if [ "" = "$BUILD_FORK" ]; then
    BUILD_FORK="xtuml"
  fi
  if [ "" = "$BUILD_BRANCH" ]; then
    BUILD_BRANCH="master"
  fi
  export PREV_DIR=`pwd`
  cd /build
  sudo git checkout -- buildmt/launch-build.sh # reset this script
  sudo git remote add $BUILD_FORK https://github.com/$BUILD_FORK/buildmt.git
  sudo git fetch --depth=1 --force $BUILD_FORK refs/heads/$BUILD_BRANCH:refs/remotes/$BUILD_FORK/$BUILD_BRANCH
  sudo git checkout $BUILD_FORK/$BUILD_BRANCH
  cd $PREV_DIR
fi

# install BridgePoint if necessary
if [[ "" != "$BP_INSTALL" ]]; then
  sudo rm -rf /build/buildmt/BridgePoint
  export BP_BUILD_LOCATION=$BP_INSTALL
  sudo -E -u jenkins bash /build/buildmt/setup.sh
  sudo /etc/init.d/jenkins restart
fi

# wait for jenkins to become available
response=`curl --write-out %{http_code} --silent --output /dev/null http://localhost:8080`
while [ "$response" != "200" ]; do
  echo "Current jenkins response is ${response}"
  sleep 20s
  response=`curl --write-out %{http_code} --silent --output /dev/null http://localhost:8080`
done

# jenkins is started but not fully ready for a web triggered build Use the
# jenkins cli to start the build which will wait until ready and not return
# until the build is complete
java -jar /build/buildmt/jenkins-cli.jar -s http://localhost:8080 -auth $JENKINS_USERNAME:$JENKINS_PASSWORD build $JOB $PARAMS 
