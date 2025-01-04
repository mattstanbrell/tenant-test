import { getAccessToken } from '$lib/server/oauth'; // your simple-oauth2 logic
// src/routes/auth/callback/+server.ts
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
    // 1. Exchange code for tokens
    const token = await getAccessToken(code);

    // 2. Inline parseJwt for the id_token
    function parseJwt(jwt: string) {
      const [header, payload, signature] = jwt.split('.');
      // we only need payload
      if (!payload) return {};
      // decode from base64 -> JSON
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    }

    // 3. Decode user claims
    const idToken = token.id_token;
    if (!idToken) {
      return json({ error: 'No id_token returned' }, { status: 400 });
    }
    const claims = parseJwt(idToken);

    // 4. Store user info in a cookie
    cookies.set('user', JSON.stringify({
      name: claims.name,
      email: claims.preferred_username
    }), {
      path: '/',
      httpOnly: false // for a simple demo; consider `true` in production
    });

    // 5. Redirect user after successful login
    throw redirect(302, '/');
  } catch (err) {
    console.error('Token exchange error:', err);
    return json({ error: 'Token exchange failed' }, { status: 400 });
  }
};
