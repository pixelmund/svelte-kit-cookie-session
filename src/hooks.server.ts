import { handleSession } from '$lib';

export const handle = handleSession({
	// init: () => ({
	// 	views: 0
	// }),
	chunked: true,
	secret: '728hH4HPFNCduN6js58D3ZAfHeoRZc4v'
});
