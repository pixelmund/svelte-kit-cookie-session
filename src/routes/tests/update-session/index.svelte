<script lang="ts">
	import { session } from '$app/stores';

	export let views: number;
</script>

<span id="views">{views}</span>
<span id="session-store-views">{$session?.views}</span>