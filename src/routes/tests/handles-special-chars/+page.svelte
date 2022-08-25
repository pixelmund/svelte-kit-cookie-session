<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<span id="name">{data.name}</span>
<span id="session_name">{data.session.name}</span>

