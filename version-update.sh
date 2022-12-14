#!/usr/bin/env bash

set -eu

###########################################
# Constants
###########################################
BUMP_PATCH="patch"
BUMP_MINOR="minor"
BUMP_MAJOR="major"
VERSION_FILE="VERSION"
VERSIONS_FILES=(setup/action.yml "${VERSION_FILE}" setup/package.json)
###########################################
# Helpers
###########################################
function logErrorAndExit() {
  echo -e "\033[0;31mERROR: ${1}\033[0m"
  exit 1
}

function verifyBump() {
  oneof_msg="should be any of [ ${BUMP_PATCH}, ${BUMP_MINOR}, ${BUMP_MAJOR} ]";
  if [[ ${#} -eq 0 ]] || [[ -z ${1+x} ]]; then
    logErrorAndExit "missing bump type: ${oneof_msg}"
  fi

  if [[ "${1}" != "${BUMP_PATCH}" ]] && [[ "${1}" != "${BUMP_MINOR}" ]] && [[ "${1}" != "${BUMP_MAJOR}" ]]; then
    logErrorAndExit "invalid bump type ${1}: ${oneof_msg}"
  fi
}

function verifyVersion() {
  convention_msg="should be in semver convention x.x.x";
  if [[ ${#} -eq 0 ]] || [[ -z ${1+x} ]]; then
    logErrorAndExit "missing version: ${convention_msg}"
  fi

  if [[ ! ${1} =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    logErrorAndExit "Invalid version ${SET_VERSION}: ${convention_msg} "
  fi

}

###########################################
# Args parse
###########################################
for i in "$@"; do
  case $i in
  --bump)
    shift;
    verifyBump "${@}";
    ACTION="${1}"
    shift ;;
  --set)
    shift;
    verifyVersion "${@}";
    SET_VERSION="${1}";
    shift ;;
  --dry-run) DRY_RUN=1; shift ;;
  --no-approve) NO_APPROVE=1; shift ;;
  -*) echo "unknown flag $i"; exit 1 ;;
  *) ;;
  esac
done

###########################################
# Verify args is make sense
###########################################
if [[ -z ${ACTION+x} ]] && [[ -z ${SET_VERSION+x} ]]; then
  logErrorAndExit "Usage: ${0} --bump [ ${BUMP_PATCH} | ${BUMP_MINOR} | ${BUMP_MAJOR} ] or --set x.x.x"
elif [[ -n ${ACTION+x} ]] && [[ -n ${SET_VERSION+x} ]]; then
  logErrorAndExit "You are trying to set version & bump version, it's not make sense. Use bump or set."
fi

###########################################
# Verify branch is clean & master
###########################################
if [[ $(git rev-parse --abbrev-ref HEAD) != master ]]; then
  logErrorAndExit "Can only update version from the master branch."
elif [[ -n $(git status -s) ]]; then
  logErrorAndExit "There are uncommitted changes, please make sure everything is committed."
fi

###########################################
# Define the new version
###########################################
version=$(cat ${VERSION_FILE})
version_patch=$(echo "${version}" | grep -Eo "[0-9]+$")
version_minor=$(echo "${version}" | grep -Eo "[0-9]+\.[0-9]+$" | grep -Eo "^[0-9]+")
version_major=$(echo "${version}" | grep -Eo "^[0-9]+")

if [[ -n ${ACTION+x} ]]; then
  if [[ "${ACTION}" = "${BUMP_PATCH}" ]]; then
    (( version_patch=version_patch+1 ))
  elif [[ "${ACTION}" = "${BUMP_MINOR}" ]]; then
    version_patch=0
    (( version_minor=version_minor+1 ))
  elif [[ "${ACTION}" = "${BUMP_MAJOR}" ]]; then
    version_patch=0
    version_minor=0
    (( version_major=version_major+1 ))
  fi

  new_version="${version_major}.${version_minor}.${version_patch}"
elif [[ -n ${SET_VERSION+x} ]]; then
  new_version="${SET_VERSION}"
else
  logErrorAndExit "failed to update version, ACTION & SET_VERSION is missing"
fi

###########################################
# Make sure the user is approving the new version
###########################################
if [[ -z ${NO_APPROVE+x} ]]; then
   echo -n "New version is: ${new_version}, do you wish to continue? [y/n] "
   read -rn 1 ok
   echo ""
   [[ "${ok}" != "y"  ]] && [[ "${ok}" != "Y" ]] && echo -e "Abort" && exit 1
fi

if [[ -n ${DRY_RUN+x} ]]; then
  echo "[Dry Run]: New version: ${new_version}"
  exit 0
fi

###########################################
# Update the repository
###########################################
for file in "${VERSIONS_FILES[@]}"; do
  sed -i'.bak' -e "s/${version}/${new_version}/g" "${file}"
done

git add "${VERSIONS_FILES[@]}"
git commit -m "chore: version update (${version} -> ${new_version})"
git tag "v${new_version}"
