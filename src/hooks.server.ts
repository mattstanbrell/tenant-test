import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Read 'user' cookie and store in locals for server load functions
  const userCookie = event.cookies.get('user');
  if (userCookie) {
    try {
      event.locals.user = JSON.parse(userCookie);
    } catch {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  const response = await resolve(event);
  return response;
};
