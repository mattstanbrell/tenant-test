// src/routes/auth/callback/+server.ts
import { getAccessToken } from '$lib/server/oauth';
import { type RequestHandler, json } from '@sveltejs/kit';

/**
 * Minimal parseJwt helper:
 */
function parseJwt(jwt: string): Record<string, any> {
  if (!jwt) return {};
  const segments = jwt.split('.');
  if (segments.length < 2) return {};

  // decode the payload (index 1)
  let base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const jsonStr = atob(base64);
  return JSON.parse(jsonStr);
}

/**
 * Use a standard return instead of `throw redirect()` or `return redirect()`.
 * Cloudflare sometimes treats thrown/Kit-redirect as an unhandled error.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
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

    const { id_token: idToken } = token;
    if (!idToken) {
      console.error('[callback/+server.ts] No id_token in token response.');
      return json({ error: 'No id_token returned' }, { status: 400 });
    }

    console.log('[callback/+server.ts] Decoding id_token...');
    const claims = parseJwt(idToken);
    console.log('[callback/+server.ts] Decoded claims:', claims);

    console.log('[callback/+server.ts] Setting user cookie...');
    const firstName = claims.given_name ?? null;
    const lastName = claims.family_name ?? null;
    // Some Microsoft tenants might use 'preferred_username' if 'email' is missing
    const email = claims.email ?? claims.preferred_username ?? null;

    console.log('[callback/+server.ts] Setting user cookie...');
    cookies.set(
      'user',
      JSON.stringify({
        firstName,
        lastName,
        email
      }),
      {
        path: '/',
        httpOnly: false, // for local demos; set `true` in production
        secure: false     // set to `true` if served over HTTPS
      }
    );

    console.log('[callback/+server.ts] User cookie set. Returning a 302...');
    /**
     * Construct a plain SvelteKit Response with a 302 status & Location header.
     * This is often safer in Cloudflare Workers than using SvelteKit’s `redirect()`.
     */
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/'
      }
    });
  } catch (err) {
    console.error('[callback/+server.ts] Token exchange error:', err);
    return json({ error: 'Token exchange failed', detail: String(err) }, { status: 400 });
  }
};
