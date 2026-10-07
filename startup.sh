#!/bin/bash

set -eu
cd /home/site/wwwroot
export NO_UPDATE_CHECK=1
exec node node_modules/serve/build/main.js --single dist --listen "${PORT:-8080}" --no-clipboard
