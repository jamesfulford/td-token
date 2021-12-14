const axios = require('axios');
const qs = require('qs');
const fs = require('fs');

const tokenOutputPath = '/output/token.json';


const CONSUMER_KEY = process.env.CONSUMER_KEY;
if (!CONSUMER_KEY) {
    throw new Error('CONSUMER_KEY is not defined');
}

async function refreshAccessAndRefreshTokens(refreshToken) {
    const data = qs.stringify({
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'client_id': CONSUMER_KEY,
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
      
    const response = await axios(config);
    return response.data;
}


function mergeAndEnrichTokens(token, newToken) {
    return {
        ...token,
        ...newToken,
        // overwrite only if the new token has the expiry fields too
        expires_at: newToken.expires_in ? Date.now() + newToken.expires_in * 1000 : token.expires_at,
        refresh_token_expires_at: newToken.refresh_token_expires_in ? Date.now() + newToken.refresh_token_expires_in * 1000 : token.refresh_token_expires_at,

        expires_in: undefined,
        refresh_token_expires_in: undefined,
    };
}

async function refreshAndEnhanceToken(token) {
    const newAccessToken = await refreshAccessAndRefreshTokens(token.refresh_token);
    return mergeAndEnrichTokens(token, newAccessToken);
}


async function main() {
    let token = JSON.parse(fs.readFileSync(tokenOutputPath).toString());

    const { refresh_token_expires_at } = token;
    const now = Date.now();
    if (now > refresh_token_expires_at) {
        console.warn("Refresh token appears to have expired, may be unable to refresh");
    }

    console.log("Refreshing access and refresh tokens...");
    token = await refreshAndEnhanceToken(token);

    fs.writeFileSync(tokenOutputPath, JSON.stringify(token, null, 2));
}

main().catch(console.error);
