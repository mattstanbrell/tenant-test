// src/lib/server/oauth.ts
import {
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET,
  AZURE_REDIRECT_URI,
  AZURE_TENANT_ID
} from '$env/static/private';

// Basic checks
if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !AZURE_TENANT_ID || !AZURE_REDIRECT_URI) {
  throw new Error('Missing environment variables for OAuth');
}

/**
 * Return a fully-formed Microsoft OAuth authorization URL.
 */
export function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: AZURE_REDIRECT_URI,
    scope: 'openid profile email',
    response_mode: 'query'
  });

  // https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/authorize
  return `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange the given authorization code for an access token (and id_token).
 */
export async function getAccessToken(code: string) {
  // Prepare URL-encoded form data
  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    redirect_uri: AZURE_REDIRECT_URI,
    grant_type: 'authorization_code',
    code
  });

  // Send POST request to token endpoint
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Token request failed: ${response.status} — ${errText}`);
  }

  // Return the token JSON object:
  // {
  //   token_type: 'Bearer',
  //   scope: '...',
  //   expires_in: 3599,
  //   ext_expires_in: 3599,
  //   access_token: '...',
  //   id_token: '...',
  //   ...
  // }
  return response.json();
}
