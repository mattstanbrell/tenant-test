<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;

	// data.user might look like:
	// { firstName: 'Matt', lastName: 'Stanbrell', email: 'matt@example.com' }
</script>

<nav>
	{#if data.user}
		<p>
			Hello {data.user.firstName}
			{data.user.lastName}!<br />
			<small>({data.user.email})</small> —
			<a href="/auth/logout">Logout</a>
		</p>
	{:else}
		<a href="/auth/login">Login with Microsoft</a>
	{/if}
</nav>

<slot />
