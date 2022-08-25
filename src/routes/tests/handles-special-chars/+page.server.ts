import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	if (locals.session.data.name) {
		return { name: locals.session.data.name };
	} else {
		await locals.session.update(() => ({ name: 'Jürgen 🤩' }));
	}

	return { name: locals.session.data.name };
};
