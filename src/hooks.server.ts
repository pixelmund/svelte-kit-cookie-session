import { handleSession } from '$lib';

export const handle = handleSession({
	// init: () => ({
	// 	views: 0
	// }),
	chunked: true,
	secret: 'A_VERY_SECRET_SECRET_USED_FOR_TESTING_THIS_LIB'
});
