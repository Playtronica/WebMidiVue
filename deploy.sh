#!/usr/bin/env sh

set -e

npm run build

cd dist


git init
git add -A
git commit -m 'deploy'

git branch deploy_branch
git push -f https://github.com/Playtronica/WebMidiVue deploy_branch

cd -