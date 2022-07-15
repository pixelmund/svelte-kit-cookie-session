import { handleSession } from '$lib';
import type { GetSession } from '@sveltejs/kit';

export const getSession: GetSession = ({ locals }) => locals.session.data;

export const handle = handleSession({
	getSession,
	secret: 'A_VERY_SECRET_SECRET_USED_FOR_TESTING_THIS_LIB'
});

