// src/routes/api/auth/login/+server.ts
import { getAuthorizationUrl } from '$lib/server/oauth';
import { redirect } from '@sveltejs/kit';

export const GET = async () => {
  // Construct the Azure authorization URL
  const url = getAuthorizationUrl();
  // Redirect user to Microsoft’s sign-in page
  throw redirect(302, url);
};
