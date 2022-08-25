import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	if (locals.session.data.views === 999) {
		await locals.session.destroy();
	} else {
		await locals.session.set({ views: 999 });
	}

	return {
		views: locals.session.data.views
	};
};
