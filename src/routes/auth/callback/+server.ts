// src/routes/auth/callback/+server.ts
import { getAccessToken } from '$lib/server/oauth';
import { json, redirect } from '@sveltejs/kit';

export const GET = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return json({ error }, { status: 400 });
  }
  if (!code) {
    return json({ error: 'Missing code parameter' }, { status: 400 });
  }

  try {
    console.log('[callback/+server.ts] Exchanging code for tokens...');
    const token = await getAccessToken(code);
    console.log('[callback/+server.ts] Token exchange success:', token);

    console.log('[callback/+server.ts] Decoding id_token...');
    const claims = parseJwt(token.id_token);
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
        httpOnly: false,
        secure: false
      }
    );

    console.log('[callback/+server.ts] User cookie set. Redirecting to /...');
    // ⬇⬇⬇  Return the redirect instead of throwing it  ⬇⬇⬇
    return redirect(302, '/');
  } catch (err) {
    console.error('[callback/+server.ts] Token exchange error:', err);
    return json({ error: 'Token exchange failed', detail: String(err) }, { status: 400 });
  }
};

/**
 * Clean inline parseJwt function
 */
function parseJwt(jwt: string): Record<string, any> {
  if (!jwt) return {};
  const segments = jwt.split('.');
  if (segments.length < 2) return {};

  const base64url = segments[1];
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const jsonStr = atob(base64);
  return JSON.parse(jsonStr);
}
