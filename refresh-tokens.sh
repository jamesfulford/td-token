#!/bin/bash

# Build
docker build -f td-token-refresh.Dockerfile -t td-token-refresh .

# Run
# kill container if already running (ignore output)
. .env  # get CONSUMER_KEY
# `CONSUMER_KEY`: string of characters you got from developer.tdameritrade.com after creating an app.
# `-v $PWD/output:/output`: sets up folder to read token from / write token to
# `-it --name td-token-refresh --rm`: clean up container when done, plus other things
docker run \
 -e CONSUMER_KEY="$CONSUMER_KEY" \
 -v $PWD/output:/output \
 -i --rm \
 td-token-refresh
