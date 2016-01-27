#!/bin/sh
# clean up
cd "$(git rev-parse --show-toplevel)"
cd charts
set -e

# deploy
rm -rf .git
git init
git remote add origin https://github.com/cmetgher/cancer-sim-charts.git
git config user.name "Cristina Metgher"
git config user.email "cmetgher@gmu.edu"
git config github.user "cmetgher"
git checkout -b gh-pages
git add .gitignore
git commit -m "Add .gitignore"
git add .
git add -f node_modules/c3/c3.js node_modules/d3/d3.js node_modules/color-hash/dist/color-hash.js node_modules/c3/c3.css node_modules/lodash/index.js node_modules/c3/c3.css
git commit -m "Deploy charts"
git push -uf origin gh-pages
rm -rf .git