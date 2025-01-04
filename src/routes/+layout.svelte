<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;
</script>

<nav>
	{#if data.user}
		<p>Hello {data.user.name} (<a href="/auth/logout">Logout</a>)</p>
	{:else}
		<a href="/auth/login">Login with Microsoft</a>
	{/if}
</nav>

<slot />
