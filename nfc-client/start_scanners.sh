#!/bin/sh

screen -S scanner1 -dm bash -c "python3 scanner.py 11 screen1 screen1_scanner1"
screen -S scanner2 -dm bash -c "python3 scanner.py 12 screen1 screen1_scanner2"
screen -S scanner3 -dm bash -c "python3 scanner.py 13 screen1 screen1_scanner3"
screen -S scanner4 -dm bash -c "python3 scanner.py 14 screen1 screen1_scanner4"
