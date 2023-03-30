import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	const hugeArray: number[] = [];

	for (let i = 0; i < 1500; i += 1) {
		hugeArray.push(i);
	}

	await locals.session.update(() => ({ views: hugeArray }));

	return {
		views: locals.session.data.views
	};
};
