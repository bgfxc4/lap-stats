#!/bin/bash

until python3 scanner.py 1 screen1 screen1_scanner1; do
    echo "Scanner crashed with exit code $?.  Respawning.." >&2
    sleep 1
done
