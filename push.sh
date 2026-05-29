#!/bin/bash
cd "$(dirname "$0")"
exec /root/.nvm/versions/node/v18.20.8/bin/node ./node_modules/.bin/rollup -c --environment DEST:pserver
