#!/bin/bash

# Build
docker build -f td-token-server.Dockerfile -t td-token-server .

# Run
# kill container if already running (ignore output)
docker kill td-token-server
. .env  # get CONSUMER_KEY
# `CONSUMER_KEY`: string of characters you got from developer.tdameritrade.com after creating an app.
# `-v $PWD/cert:/cert`: passes your self-signed certs to the app
# `-v $PWD/output:/output`: sets up folder to write token to
# `-it -p 8000:8000 --name td-token-server --rm`: expose port 8000, clean up container when done, plus other things
docker run \
    -e CONSUMER_KEY="$CONSUMER_KEY" \
    -v $PWD/cert:/cert \
    -v $PWD/output:/output \
    -it -p 8000:8000 --name td-token-server --rm \
    td-token-server
