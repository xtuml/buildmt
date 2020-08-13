#!/bin/bash

# This script is intended to launch xfce4 in order to populate initial
# configuration
startxfce4 &
sleep 5
xfce4-session-logout
