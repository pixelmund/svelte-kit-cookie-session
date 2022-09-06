import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ locals }) => {
		await locals.session.update((sd) =>
			sd.views == null ? { views: 1 } : { views: sd.views + 1 }
		);

		return {};
	}
};
