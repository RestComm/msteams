#!/bin/bash

echo "Creating the dist folder"
rm -rf dist && mkdir dist 


echo "Transpiling from babel code....."
npx babel ./src -d ./dist/src -s 

echo "Copying static files and assets"
cp -r public ./dist
cp .env.prod ./dist/.env
cp package.json ./dist/package.json
cp production.json ./dist/production.json
cp yarn.lock ./dist/yarn.lock
