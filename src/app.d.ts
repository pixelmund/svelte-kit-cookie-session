/// <reference types="@sveltejs/kit" />

type SessionData = any;

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface Locals {
		session: import('./lib').Session<SessionData>;
	}

	// interface Platform {}
	
	interface Session extends SessionData {}

	interface PageData {
		session: SessionData;
	}
	// interface Stuff {}
}
