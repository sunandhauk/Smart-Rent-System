const axios = require("axios");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const exchangeCodeForGoogleProfile = async ({ code, redirectUri }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const resolvedRedirectUri = process.env.GOOGLE_REDIRECT_URI || redirectUri;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured on the server");
  }

  if (!resolvedRedirectUri) {
    throw new Error("Google redirect URI is not configured");
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: resolvedRedirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await axios.post(
    GOOGLE_TOKEN_URL,
    tokenParams.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      proxy: false,
      timeout: 10000,
    }
  );

  const accessToken = tokenResponse.data?.access_token;

  if (!accessToken) {
    throw new Error("Google token exchange failed");
  }

  const profileResponse = await axios.get(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    proxy: false,
    timeout: 10000,
  });

  return profileResponse.data;
};

module.exports = {
  exchangeCodeForGoogleProfile,
};
