# Get Consumer Key

Go to developer.tdameritrade.com. Register. (This developer account is separate from your TD brokerage account.)

Login. Go to My Apps. Create an app. Make sure the redirect urls include `https://localhost:8000`. Copy the Consumer Key. Save it in .env like so:

```bash
CONSUMER_KEY="put consumer key here"
echo "CONSUMER_KEY=$CONSUMER_KEY" > .env
```

# Get Initial Token

## Generate self-signed certificate

TD Ameritrade's login system does not allow redirecting to a non-HTTPS site, which means we need to set up our own SSL certificates. Follow instructions here: https://timonweb.com/django/https-django-development-server-ssl-certificate/

When it comes time to create the cert, run this instead so it goes in the correct directory:

```bash
mkdir -p ./cert
mkcert -cert-file ./cert/cert.crt -key-file ./cert/key.key localhost 127.0.0.1
```

## Run Server

```bash
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
```

## Login

Visit https://localhost:8000 (http*s* is important). Click login.

Login with your TD brokerage account (_not your developer account on developer.tdameritrade.com_). Make sure you login with the userid of the account you wish to trade with (IRA, Individual, etc.).

When prompted, grant your app access by clicking "Allow".

You will be redirected back to localhost and should see a success page. The server will stop running once this succeeds.

## Output

The server will write the token to `output/token.json`.

```json
{
  // Add `Authorization: Bearer {access_token}` header in API calls
  "access_token": "",
  // approximate time access_token expires, epoch timestamp ms
  // (usually 30 minutes after issuing)
  "expires_at": 1639422978915,

  // used to get a new access_token after the current access_token expires.
  "refresh_token": "",
  // approximate time refresh_token expires, epoch timestamp ms
  // (usually 90 days after issuing)
  "refresh_token_expires_at": 1647197178915,

  // permissions your app has available on behalf of its user
  "scope": "PlaceTrades AccountAccess MoveMoney",
  "token_type": "Bearer"
}
```

# Refresh token

With a token.json file existing at `output/token.json`, run:

```bash
# Build
docker build -f td-token-refresh.Dockerfile -t td-token-refresh .

# Run
# kill container if already running (ignore output)
docker kill td-token-refresh
. .env  # get CONSUMER_KEY
# `CONSUMER_KEY`: string of characters you got from developer.tdameritrade.com after creating an app.
# `-v $PWD/output:/output`: sets up folder to read token from / write token to
# `-it --name td-token-refresh --rm`: clean up container when done, plus other things
docker run \
 -e CONSUMER_KEY="$CONSUMER_KEY" \
 -v $PWD/output:/output \
 -it --name td-token-refresh --rm \
 td-token-refresh
```
