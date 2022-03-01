# Get Consumer Key

Go to developer.tdameritrade.com. Register. (This developer account is separate from your TD brokerage account.)

Login. Go to My Apps. Create an app. Make sure the redirect urls include `https://localhost:8000`. Set limit to 120 (max). Copy the Consumer Key. Save it in .env like so:

```bash
CONSUMER_KEY="put consumer key here"
echo "CONSUMER_KEY=$CONSUMER_KEY" > .env
```

# Get Initial Token

## Generate self-signed certificate (once)

TD Ameritrade's oauth2 login system does not allow redirecting to a non-HTTPS site, which means we need to set up our own SSL certificates.

```bash
# Install
brew install mkcert
mkcert -install  # accept our certs locally

mkdir -p ./cert
# Generate certs
mkcert -cert-file ./cert/cert.crt -key-file ./cert/key.key localhost 127.0.0.1
```

Original instructions here: https://timonweb.com/django/https-django-development-server-ssl-certificate/

## Run Server

```bash
./start-login.sh > /dev/null 2>&1 &
python -m webbrowser -n https://localhost:8000
# (or visit https://localhost:8000 ; use http*s*.)
```

Click login.

Login with your Login with your TD brokerage account (_not your developer account on developer.tdameritrade.com_). Make sure you login with the userid of the account you wish to trade with. If one login has multiple accounts (Individual, Cash/Margin, ROTH Ira, etc.), you can provide the account id later (when making API calls).

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
./refresh-tokens.sh
```

Note that this requires no human involvement, so you could put it in a cron job.

It may fail if the refresh_token stored in token.json has expired, which would happen if the refresh script has not been run for over 90 days since the last refresh or initial issuing.

# Usage Patterns

Once you have an initial token by logging into the server, you will not need to login again (barring disaster).

An access token expires after 30m. Either:

- refresh the tokens immediately before a short-running script and have the script read from `token.json`, or
- refresh the tokens every 20m with a cron job (`*/20 * * * * cd ~/td-token && ./refresh-tokens.sh`) and have any scripts/services read `token.json` immediately before usage and not keep the value in memory.
