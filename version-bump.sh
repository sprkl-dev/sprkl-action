#!/usr/bin/env bash

set -eu

BUMP_PATCH="patch"
BUMP_MINOR="minor"
BUMP_MAJOR="major"

VERSION_FILE="VERSION"

if [ ${#} -lt 1 ];
then
  echo "Usage: ${0} [ ${BUMP_PATCH} | ${BUMP_MINOR} | ${BUMP_MAJOR} ]"
  exit 1
fi

if [ ${1} != ${BUMP_PATCH} ] && [ ${1} != ${BUMP_MINOR} ] && [ ${1} != ${BUMP_MAJOR} ];
then
  echo "Parameter [ ${1} ] should be any of [ ${BUMP_PATCH} | ${BUMP_MINOR} | ${BUMP_MAJOR} ]."
  exit 1
fi

if [[ ! -z $(git status -s) ]]; then
  echo "There are uncommitted changes, please make sure everything is committed."
  exit 1
fi


version=$(cat ${VERSION_FILE})

version_patch=$(echo $version | grep -Eo "[0-9]+$")
version_minor=$(echo $version | grep -Eo "[0-9]+\.[0-9]+$" | grep -Eo "^[0-9]+")
version_major=$(echo $version | grep -Eo "^[0-9]+")

if [ ${1} = ${BUMP_PATCH} ];
then
  let "version_patch=version_patch+1"
elif [ ${1} = ${BUMP_MINOR} ];
then
  version_patch=0
  let "version_minor=version_minor+1"
elif [ ${1} = ${BUMP_MAJOR} ];
then
  version_patch=0
  version_minor=0
  let "version_major=version_major+1"
fi

new_version="${version_major}.${version_minor}.${version_patch}"

versions_files=(setup/action.yml $VERSION_FILE setup/package.json)
for file in "${versions_files[@]}"; do
  sed -i'.bak' -e "s/$version/$new_version/g" $file
done

git add .
git commit -m "chore: version bump ($version --> $new_version)"
git tag "v$new_version"
