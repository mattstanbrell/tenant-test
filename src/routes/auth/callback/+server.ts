// src/routes/auth/callback/+server.ts

import { getAccessToken } from '$lib/server/oauth';
import { json, redirect } from '@sveltejs/kit';

/**
 * Minimal parseJwt helper:
 */
function parseJwt(jwt: string): Record<string, any> {
  if (!jwt) return {};
  const segments = jwt.split('.');
  if (segments.length < 2) return {};

  // decode the payload
  let base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const jsonStr = atob(base64);
  return JSON.parse(jsonStr);
}

export const GET = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('[callback/+server.ts] Got "error" param:', error);
    return json({ error }, { status: 400 });
  }
  if (!code) {
    console.error('[callback/+server.ts] No code param, cannot proceed.');
    return json({ error: 'Missing code parameter' }, { status: 400 });
  }

  try {
    console.log('[callback/+server.ts] Exchanging code for tokens...');
    const token = await getAccessToken(code);
    console.log('[callback/+server.ts] Token exchange success:', token);

    console.log('[callback/+server.ts] Decoding id_token...');
    const { id_token: idToken } = token;
    if (!idToken) {
      console.error('[callback/+server.ts] No id_token in response.');
      return json({ error: 'No id_token returned' }, { status: 400 });
    }
    const claims = parseJwt(idToken);
    console.log('[callback/+server.ts] Decoded claims:', claims);

    console.log('[callback/+server.ts] Setting user cookie...');
    cookies.set(
      'user',
      JSON.stringify({
        name: claims.name,
        email: claims.preferred_username
      }),
      {
        path: '/',
        httpOnly: false,  // for demo only; set to `true` in production
        secure: false      // set to `true` if site is served via HTTPS
      }
    );

    console.log('[callback/+server.ts] User cookie set. Redirecting to /...');
    // IMPORTANT: return the redirect, not throw
    return redirect(302, '/');
  } catch (err) {
    // Log real errors
    console.error('[callback/+server.ts] Token exchange error:', err);
    return json({ error: 'Token exchange failed', detail: String(err) }, { status: 400 });
  }
};
