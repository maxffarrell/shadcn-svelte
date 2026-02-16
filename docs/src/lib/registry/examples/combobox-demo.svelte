<script lang="ts">
	import * as Combobox from "$lib/registry/ui/combobox/index.js";

	const frameworks = [
		{ value: "sveltekit", label: "SvelteKit" },
		{ value: "nextjs", label: "Next.js" },
		{ value: "nuxtjs", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const selectedLabel = $derived(
		frameworks.find((f) => f.value === value)?.label ?? "Select a framework..."
	);

	const filteredItems = $derived(
		searchValue === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);
</script>

<Combobox.Root type="single" bind:open bind:value items={frameworks}>
	<Combobox.Input
		placeholder={selectedLabel}
		oninput={(e) => (searchValue = e.currentTarget.value)}
		class="w-[200px]"
	/>
	<Combobox.Content>
		{#if filteredItems.length === 0}
			<Combobox.Empty>No framework found.</Combobox.Empty>
		{:else}
			<Combobox.Group>
				{#each filteredItems as framework (framework.value)}
					<Combobox.Item value={framework.value} label={framework.label} />
				{/each}
			</Combobox.Group>
		{/if}
	</Combobox.Content>
</Combobox.Root>
