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
 * Build the Microsoft OAuth authorization URL.
 */
export function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: AZURE_REDIRECT_URI,
    scope: 'openid profile email', // ensure profile scope is included for given_name / family_name
    response_mode: 'query'
  });

  // https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/authorize
  return `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange the given authorization code for an access token (and id_token).
 */
export async function getAccessToken(code: string) {
  // Prepare the POST body
  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    redirect_uri: AZURE_REDIRECT_URI,
    grant_type: 'authorization_code',
    code
  });

  // Token endpoint
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  console.log('[oauth.ts] Attempting token exchange at:', tokenUrl);
  console.log('[oauth.ts] Body:', Object.fromEntries(body.entries()));

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  console.log('[oauth.ts] Response status:', response.status);
  console.log('[oauth.ts] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Token request failed: ${response.status} – ${errText}`);
  }

  const tokenJson = await response.json();
  console.log('[oauth.ts] Token exchange success. Received:', tokenJson);
  return tokenJson;
}
