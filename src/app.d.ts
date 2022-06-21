/// <reference types="@sveltejs/kit" />

interface SessionData {
	views: number;
	name?: string;
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface Locals {
		session: import('./lib').Session<SessionData>;
	}
	// interface Platform {}
	interface Session extends SessionData {}
	// interface Stuff {}
}
