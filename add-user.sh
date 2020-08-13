#!/bin/bash
if [[ 1 != $# ]]; then
  echo "Usage:"
  echo "  $0 <USERNAME>"
  exit
fi
USERNAME=$1
useradd -p `perl -e 'print crypt("password", "salt"),"\n"'` -g build $USERNAME -s /bin/bash  # create a user with default password, primary group build and bash as the shell
usermod -G sudo -a $USERNAME                                                                 # add the user to the sudoers group
echo "$USERNAME ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers                                     # allow the user to sudo without password
