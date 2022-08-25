import { handleSession } from '$lib';

export const handle = handleSession({
	secret: 'A_VERY_SECRET_SECRET_USED_FOR_TESTING_THIS_LIB'
});

