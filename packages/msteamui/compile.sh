#!/bin/bash

# build the application to dist folder
echo "building application to build folder"
yarn build

echo "copying build folder to msteam public folder"
yes | cp -rf build/ ../msteams/public/

echo "DONE"