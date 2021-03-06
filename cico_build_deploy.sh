#!/bin/bash

# Show command before executing
set -x

# Exit on error
set -e

# Export needed vars
set +x
for var in BUILD_NUMBER BUILD_URL JENKINS_URL GIT_BRANCH GH_TOKEN NPM_TOKEN GIT_COMMIT DEVSHIFT_USERNAME DEVSHIFT_PASSWORD DEVSHIFT_TAG_LEN; do
  export $(grep ${var} jenkins-env | xargs)
done
export BUILD_TIMESTAMP=`date -u +%Y-%m-%dT%H:%M:%S`+00:00
set -x

# We need to disable selinux for now, XXX
/usr/sbin/setenforce 0

# Get all the deps in
yum -y install docker
yum clean all
service docker start

# Build builder image
docker build -t openfact-ui-builder -f Dockerfile.builder .
mkdir -p dist && docker run --detach=true --name=openfact-ui-builder -t -v $(pwd)/dist:/dist:Z -e BUILD_NUMBER -e BUILD_URL -e BUILD_TIMESTAMP -e JENKINS_URL -e GIT_BRANCH -e "CI=true" -e GH_TOKEN -e NPM_TOKEN -e OPENFACT_BRANDING=openfact -e OPENFACT_REALM=openfact openfact-ui-builder

# In order to run semantic-release we need a non detached HEAD, see https://github.com/semantic-release/semantic-release/issues/329
docker exec openfact-ui-builder git checkout master

# Build almigty-ui
docker exec openfact-ui-builder npm install

## Exec unit tests
docker exec openfact-ui-builder ./run_unit_tests.sh

  if [ $? -eq 0 ]; then
    echo 'CICO: unit tests OK'
    ./upload_to_codecov.sh
else
  echo 'CICO: unit tests FAIL'
  exit 1
fi

## Exec functional tests
docker exec openfact-ui-builder ./run_functional_tests.sh

## Run the prod build
docker exec openfact-ui-builder npm run build:prod

set +e
if [ $? -eq 0 ]; then
  echo 'CICO: functional tests OK'
  docker exec openfact-ui-builder npm run semantic-release
  docker exec -u root openfact-ui-builder cp -r /home/openfact/openfact-ui/dist /
  ## All ok, deploy
  if [ $? -eq 0 ]; then
    echo 'CICO: build OK'

    TAG=$(echo $GIT_COMMIT | cut -c1-${DEVSHIFT_TAG_LEN})
    REGISTRY="push.registry.devshift.net"

    if [ -n "${DEVSHIFT_USERNAME}" -a -n "${DEVSHIFT_PASSWORD}" ]; then
      docker login -u ${DEVSHIFT_USERNAME} -p ${DEVSHIFT_PASSWORD} ${REGISTRY}
    else
      echo "Could not login, missing credentials for the registry"
    fi

    docker build -t openfact-ui-deploy -f Dockerfile.deploy . && \
    docker tag openfact-ui-deploy ${REGISTRY}/openfact-ui/openfact-ui:$TAG && \
    docker push ${REGISTRY}/openfact-ui/openfact-ui:$TAG && \
    docker tag openfact-ui-deploy ${REGISTRY}/openfact-ui/openfact-ui:latest && \
    docker push ${REGISTRY}/openfact-ui/openfact-ui:latest
    if [ $? -eq 0 ]; then
      echo 'CICO: image pushed, npmjs published, ready to update deployed app'
      exit 0
    else
      echo 'CICO: Image push to registry failed'
      exit 2
    fi
  else
    echo 'CICO: app tests Failed'
    exit 1
  fi
else
  echo 'CICO: functional tests FAIL'
  exit 1
fi

