require('dotenv').config();

const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const https = require('https');

const app = require('express')();

const CALLBACK_URL = process.env.CALLBACK_URL || 'https://localhost:8000';

const CONSUMER_KEY = process.env.CONSUMER_KEY;
if (!CONSUMER_KEY) {
    throw new Error('CONSUMER_KEY is not defined');
}

const credentials = {
    key: fs.readFileSync('/cert/key.key'),
    cert: fs.readFileSync('/cert/cert.crt'),
}
const tokenOutputPath = '/output/token.json';

const REDIRECT_URI = "https://auth.tdameritrade.com/auth" +
    "?response_type=code" +
    "&redirect_uri=" + encodeURIComponent(CALLBACK_URL) +
    "&client_id=" + process.env.CONSUMER_KEY + "%40AMER.OAUTHAP";

// exchange code for access token with tdameritrade
async function exchangeCodeForAccessToken(code) {
    const data = qs.stringify({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': CONSUMER_KEY + '@AMER.OAUTHAP',
        'redirect_uri': CALLBACK_URL,
        'access_type': 'offline',
    });
    const config = {
        method: 'post',
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    return await axios(config);
}

app.get("/", async (req, res) => {
    if (req.query.code) {
        try {
            const { data: token } = await exchangeCodeForAccessToken(req.query.code);
            await storeTokenInLongTermStorage(token);
            res.send("Logged in successfully, can close this tab.");

            // shut down server, we got a token successfully
            process.exit(0);
        } catch (error) {
            console.error(error.response.status, error.response.data);
            res.redirect("/");
        }
        return;
    }
    res.send(`<a href="${REDIRECT_URI}">Login</a>`);
});

function enrichToken(token) {
    return {
        ...token,
        expires_at: Date.now() + token.expires_in * 1000,
        refresh_token_expires_at: Date.now() + token.refresh_token_expires_in * 1000,
    };
}


async function storeTokenInLongTermStorage(token) {
    fs.writeFileSync(tokenOutputPath, JSON.stringify(enrichToken(token)));
}

https.createServer(credentials, app).listen(8000);
