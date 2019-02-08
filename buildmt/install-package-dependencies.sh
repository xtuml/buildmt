#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
TMPFILE="/tmp/pkg_dep_install.log"
echo "Installing dependencies. Install log at $TMPFILE."
apt install -y gtk2.0 vim vnc4server maven unzip pypy awscli zip flex bison clang gcc-mingw-w64-x86-64 xsltproc xrdp xfce4 > $TMPFILE
