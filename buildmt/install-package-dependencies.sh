#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
echo "Installing dependencies."
apt install -y gtk2.0 vim vnc4server maven unzip pypy awscli zip flex bison clang gcc-mingw-w64-x86-64 xsltproc xrdp xfce4 xvfb visualvm
