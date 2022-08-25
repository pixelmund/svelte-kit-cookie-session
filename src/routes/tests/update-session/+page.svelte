<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<span id="views">{data.views}</span>
<span id="session-store-views">{data.session?.views}</span>
