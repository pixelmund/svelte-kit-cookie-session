import type { Action } from '@sveltejs/kit';

export const POST: Action = async ({ locals }) => {
	await locals.session.update((sd) => (sd.views == null ? { views: 1 } : { views: sd.views + 1 }));

	return;
};
