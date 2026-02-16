<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";

	const frameworks = [
		{ value: "nextjs", label: "Next.js", disabled: false },
		{ value: "sveltekit", label: "SvelteKit", disabled: false },
		{ value: "nuxtjs", label: "Nuxt.js", disabled: true },
		{ value: "remix", label: "Remix", disabled: true },
		{ value: "astro", label: "Astro", disabled: false },
	];

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);
</script>

<Example title="Disabled Items">
	<Combobox.Root type="single" bind:open bind:value items={frameworks}>
		<Combobox.Input
			placeholder="Search framework..."
			oninput={(e) => (searchValue = e.currentTarget.value)}
			class="w-[200px]"
		/>
		<Combobox.Content>
			{#if filteredItems.length === 0}
				<Combobox.Empty>No items found.</Combobox.Empty>
			{:else}
				<Combobox.Group>
					{#each filteredItems as framework (framework.value)}
						<Combobox.Item
							value={framework.value}
							label={framework.label}
							disabled={framework.disabled}
						/>
					{/each}
				</Combobox.Group>
			{/if}
		</Combobox.Content>
	</Combobox.Root>
</Example>
