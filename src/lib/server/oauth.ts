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

export function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: AZURE_REDIRECT_URI,
    scope: 'openid profile email',
    response_mode: 'query'
  });

  return `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string) {
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    redirect_uri: AZURE_REDIRECT_URI,
    grant_type: 'authorization_code',
    code
  });

  console.log('[oauth.ts] Attempting token exchange at:', tokenUrl);
  console.log('[oauth.ts] Body:', Object.fromEntries(body));

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  // Log the status and headers first
  console.log('[oauth.ts] Response status:', response.status);
  console.log('[oauth.ts] Response headers:', Object.fromEntries(response.headers.entries()));

  // If Azure sends a 302, the "Location" header or HTML body might show the reason
  if (response.status !== 200) {
    // Attempt to read the response text
    const errText = await response.text();
    console.error('[oauth.ts] Non-OK response:', response.status, errText);
    throw new Error(`Token request failed with status ${response.status}. Body: ${errText}`);
  }

  const tokenData = await response.json();
  console.log('[oauth.ts] Token exchange success. Received:', tokenData);

  // For reference: tokenData has shape:
  // {
  //   token_type: 'Bearer',
  //   scope: '...',
  //   expires_in: 3599,
  //   ext_expires_in: 3599,
  //   access_token: '...',
  //   id_token: '...',
  //   ...
  // }

  return tokenData;
}
