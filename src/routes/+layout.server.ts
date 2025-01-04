// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const userCookie = cookies.get('user');
  let user = null;

  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      // parse error
    }
  }

  return { user };
};
