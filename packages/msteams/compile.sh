#!/bin/bash

#build the ui
if [ "$1" = "client" ]
then
  echo "building the client........"
  cd ../msteamui && ./compile.sh
  echo "change directory"
  cd ../msteams
fi

echo "Creating the dist folder"
rm -rf dist && mkdir dist 


echo "Transpiling from babel code....."
npx babel ./src -d ./dist/src --source-maps --copy-files

echo "Copying static files and assets"
cp -r public ./dist
cp .env.prod ./dist/.env
cp package.json ./dist/package.json
cp production.json ./dist/production.json
cp ../../yarn.lock ./dist/yarn.lock
