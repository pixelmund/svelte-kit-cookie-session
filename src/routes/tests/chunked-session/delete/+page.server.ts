import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	// for testing the chunked cookies feature we have to build up a huge array, greater than 4096 bytes
	if (locals.session.data.views && Array.isArray(locals.session.data.views)) {
		await locals.session.destroy();
	} else {
		const hugeArray = [];

		for (let i = 0; i < 1000; i += 1) {
			hugeArray.push(i);
		}

		await locals.session.set({
			views: hugeArray
		});
	}

	return {
		views: locals.session.data.views
	};
};
