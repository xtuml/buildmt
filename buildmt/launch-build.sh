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
  echo "  ./launch-build.sh --username <jenkins_username> --password <jenkins_password> [--installation <bp-installation-folder>] [--params ...]"
  exit 1
}

DIRECTIVE=
for i in $@; do
  case $i in
    "--username"|"--password"|"--installation"|"--params")
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
        *)
          printUsage
          ;;
      esac
      ;;
  esac
done
if [[ "" == "$JENKINS_USERNAME" || "" == "$JENKINS_PASSWORD" ]]; then
  printUsage
fi

# install BridgePoint if necessary
if [[ "" != "$BP_INSTALL" ]]; then
  sudo rm -rf /build/buildmt/BridgePoint
  export BP_BUILD_LOCATION=$BP_INSTALL
  sudo -u jenkins bash /build/buildmt/setup.sh
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
java -jar /build/buildmt/jenkins-cli.jar -s http://localhost:8080 build $JOB $PARAMS --username $JENKINS_USERNAME --password $JENKINS_PASSWORD
