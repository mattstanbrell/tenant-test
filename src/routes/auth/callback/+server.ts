// src/routes/auth/callback/+server.ts
import { getAccessToken } from '$lib/server/oauth';
import { json, redirect } from '@sveltejs/kit';

export const GET = async ({ url, cookies }) => {
  // 1. Check for code and error params
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  console.log('[callback/+server.ts] Called with code:', code, 'and error:', error);

  if (error) {
    console.error('[callback/+server.ts] Error parameter present:', error);
    return json({ error }, { status: 400 });
  }
  if (!code) {
    console.error('[callback/+server.ts] Missing code parameter');
    return json({ error: 'Missing code parameter' }, { status: 400 });
  }

  try {
    // 2. Exchange code for tokens
    console.log('[callback/+server.ts] Exchanging code for tokens...');
    const token = await getAccessToken(code);
    console.log('[callback/+server.ts] Token exchange success:', token);

    // 3. Inline parseJwt to decode base64url
    function parseJwt(jwt: string) {
      const segments = jwt.split('.');
      // Must have header, payload, signature → at least 2 '.' delimiters
      if (segments.length < 2) {
        console.warn('[callback/+server.ts] Malformed JWT:', jwt);
        return {};
      }

      // we only need the payload (index 1)
      let base64Payload = segments[1];
      // convert base64url to standard base64
      base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      // add padding if necessary
      while (base64Payload.length % 4 !== 0) {
        base64Payload += '=';
      }

      const jsonStr = atob(base64Payload);
      return JSON.parse(jsonStr);
    }

    // 4. Extract the id_token and parse it
    const { id_token: idToken } = token;
    if (!idToken) {
      console.error('[callback/+server.ts] No id_token returned from provider:', token);
      return json({ error: 'No id_token returned from provider' }, { status: 400 });
    }

    console.log('[callback/+server.ts] Decoding id_token...');
    const claims = parseJwt(idToken);
    console.log('[callback/+server.ts] Decoded claims:', claims);

    // 5. Store partial user info in a cookie
    console.log('[callback/+server.ts] Setting user cookie...');
    cookies.set(
      'user',
      JSON.stringify({
        name: claims.name,
        email: claims.preferred_username
      }),
      {
        path: '/',
        httpOnly: false,   // for a simple demo; consider 'true' in production
        secure: false      // set to `true` on HTTPS in production
      }
    );

    console.log('[callback/+server.ts] User cookie set. Redirecting to /...');
    throw redirect(302, '/');
  } catch (err) {
    // 6. Provide more informative error details
    let detail: string;
    if (err instanceof Error) {
      detail = err.message;
    } else if (typeof err === 'object') {
      detail = JSON.stringify(err);
    } else {
      detail = String(err);
    }

    console.error('[callback/+server.ts] Token exchange error:', detail);
    return json({ error: 'Token exchange failed', detail }, { status: 400 });
  }
};
