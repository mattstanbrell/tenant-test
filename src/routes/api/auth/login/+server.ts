import { authorizationUrl } from '$lib/server/oauth';
// src/routes/auth/login/+server.ts
import { redirect } from '@sveltejs/kit';

export const GET = async () => {
  throw redirect(302, authorizationUrl);
};
