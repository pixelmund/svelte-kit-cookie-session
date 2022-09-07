<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	async function updateSession() {
		const response = await fetch('/tests/sync-session', {
			method: 'POST',
			headers: { Accept: 'application/json' },
			body: new FormData(),
		});
		if (response.headers.has('x-svelte-kit-cookie-session-needs-sync')) {
			await invalidateAll();
		}
	}

	onMount(async () => {
		await updateSession();
	});
</script>

<h1 id="session-store-views">{$page.data.session.views}</h1>
