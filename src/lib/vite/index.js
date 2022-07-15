import customStores from './stores.js';

/**
 * @returns {import('vite').Plugin}
 */
export function cookieSession() {
	return {
		name: 'vite-plugin-svelte-kit-cookie-session',
		transform: (src, id) => {
			if (id.includes('.svelte-kit/runtime/app/stores.js')) {
				src = customStores;
			}
			return {
				code: src
			};
		}
	};
}
