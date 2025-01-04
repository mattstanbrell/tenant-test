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
    // 1. Exchange 'code' for tokens
    const token = await getAccessToken(code);

    // 2. Inline parseJwt that correctly decodes base64url
    function parseJwt(jwt: string) {
      const segments = jwt.split('.');
      if (segments.length < 2) {
        return {};
      }
      // we only need the payload (index 1)
      const base64url = segments[1];
      // convert base64url to standard base64
      let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const jsonStr = atob(base64);
      return JSON.parse(jsonStr);
    }

    // 3. Decode user claims from id_token
    const { id_token: idToken } = token;
    if (!idToken) {
      return json({ error: 'No id_token returned from provider' }, { status: 400 });
    }
    const claims = parseJwt(idToken);

    // 4. Store partial user info in a cookie
    cookies.set('user', JSON.stringify({
      name: claims.name,
      email: claims.preferred_username
    }), {
      path: '/',
      httpOnly: false, // set to `true` in production for better security
      secure: false     // set to `true` in production if using HTTPS
    });

    // 5. Redirect back to homepage (or anywhere you like)
    throw redirect(302, '/');
  } catch (err) {
    console.error('Token exchange error:', err);
    // Return a more helpful error object
    const message = err instanceof Error ? err.message : String(err);
    return json({
      error: 'Token exchange failed',
      detail: message
    }, { status: 400 });
  }
};
