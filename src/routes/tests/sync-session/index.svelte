<script lang="ts">
	import { session } from '$app/stores';
	import { onMount } from 'svelte';

	async function updateSession() {
		await fetch('/tests/sync-session', {
			method: 'POST',
			headers: { Accept: 'application/json' }
		});
		await (session as any).sync();
	}

	onMount(async () => {
		await updateSession();
	});
</script>

<h1 id="session-store-views">{$session.views}</h1>
