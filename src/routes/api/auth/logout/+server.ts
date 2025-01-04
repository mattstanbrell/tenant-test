import { redirect } from '@sveltejs/kit';

export const GET = async ({ cookies }) => {
  cookies.delete('user', { path: '/' });
  throw redirect(302, '/');
};
