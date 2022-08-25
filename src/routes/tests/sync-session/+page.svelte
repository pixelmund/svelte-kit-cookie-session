<script lang="ts">
	import { session } from '$app/stores';
	import { onMount } from 'svelte';

	async function updateSession() {
		const response = await fetch('/tests/sync-session', {
			method: 'POST',
			headers: { Accept: 'application/json' }
		});
		if (response.headers.has('x-svelte-kit-cookie-session-needs-sync')) {
			const sessionData = await fetch('/__session.json').then((r) => (r.ok ? r.json() : null));
			if (sessionData) {
				session.set(sessionData);
			}
		}
	}

	onMount(async () => {
		await updateSession();
	});
</script>

<h1 id="session-store-views">{$session.views}</h1>
