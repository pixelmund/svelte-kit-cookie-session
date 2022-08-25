import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = ({ locals }) => {
	return {
		session: locals.session.data
	};
};
