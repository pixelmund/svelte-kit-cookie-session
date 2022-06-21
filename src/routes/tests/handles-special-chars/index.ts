import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
	if (locals.session.data.name) {
		return {
			body: {
				name: locals.session.data.name
			}
		};
	} else {
		await locals.session.update(() => ({ name: 'Jürgen 🤩' }));
	}

	return {
		body: {
			name: locals.session.data.name
		}
	};
};
