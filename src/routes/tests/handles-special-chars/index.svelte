<script lang="ts">
	import { session } from '$app/stores';

	export let name: string;
	$: session_name = $session.name;
</script>

<span id="name">{name}</span>
<span id="session_name">{session_name}</span>

