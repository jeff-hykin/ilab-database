#!/usr/bin/env bash
EXPRESS_MAIN_PATH="$(node -e 'console.log(require("./package.json").parameters.paths.expressMain)')"
npm install
node "$EXPRESS_MAIN_PATH"