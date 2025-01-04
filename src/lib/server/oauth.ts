import { AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_REDIRECT_URI, AZURE_TENANT_ID } from "$env/static/private";
//src/lib/server/oauth.ts
import { AuthorizationCode } from 'simple-oauth2';

const clientId = AZURE_CLIENT_ID;
const clientSecret = AZURE_CLIENT_SECRET;
const tenantId = AZURE_TENANT_ID;
const redirectUri = AZURE_REDIRECT_URI;

if (!clientId || !clientSecret || !tenantId || !redirectUri) {
  throw new Error('Missing environment variables for OAuth');
}

const oauthClient = new AuthorizationCode({
  client: {
    id: clientId,
    secret: clientSecret
  },
  auth: {
    tokenHost: `https://login.microsoftonline.com/${tenantId}`,
    tokenPath: `/${tenantId}/oauth2/v2.0/token`,
    authorizePath: `/${tenantId}/oauth2/v2.0/authorize`
  }
});

export const authorizationUrl = oauthClient.authorizeURL({
  redirect_uri: redirectUri,
  scope: ['openid', 'profile', 'email']
});

export async function getAccessToken(code: string) {
  const tokenConfig = {
    code,
    redirect_uri: redirectUri
  };
  const result = await oauthClient.getToken(tokenConfig);
  return result.token; // includes id_token, access_token, refresh_token, etc.
}
