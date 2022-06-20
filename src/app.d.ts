/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface Locals {
		session: import('./lib').Session<{ views: number }>;
	}
	// interface Platform {}
	interface Session {
		views: number;
	}
	// interface Stuff {}
}
