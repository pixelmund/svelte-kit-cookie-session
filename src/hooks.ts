import { handleSession } from '$lib';
import type { GetSession } from '@sveltejs/kit';

export const handle = handleSession({
	secret: 'A_VERY_SECRET_SECRET_USED_FOR_TESTING_THIS_LIB'
});

export const getSession: GetSession = ({ locals }) => locals.session.data;
