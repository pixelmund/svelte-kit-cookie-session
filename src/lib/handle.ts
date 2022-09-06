import { cookieSession } from './core.js';
import type { Handle } from '@sveltejs/kit';
import type { SessionOptions } from './types';

export function handleSession(
	options: SessionOptions,
	passedHandle: Handle = async ({ event, resolve }) => resolve(event)
): Handle {
	return async function handle({ event, resolve }) {
		const { session } = (await cookieSession(event, options)) as any as {
			session: { 'set-cookie': string; data: any; needsSync: boolean };
		};

		(event.locals as any).session = session;

		const response = await passedHandle({ event, resolve });

		if (session.needsSync) {
			response.headers.set('x-svelte-kit-cookie-session-needs-sync', '1');
		}

		return response;
	};
}
