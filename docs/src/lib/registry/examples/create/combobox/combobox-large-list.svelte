<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";

	const largeListItems = Array.from({ length: 100 }, (_, i) => ({
		value: `item-${i + 1}`,
		label: `Item ${i + 1}`,
	}));

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? largeListItems
			: largeListItems.filter((item) =>
					item.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);
</script>

<Example title="Large List (100 items)">
	<Combobox.Root type="single" bind:open bind:value items={largeListItems}>
		<Combobox.Input
			placeholder="Search from 100 items"
			oninput={(e) => (searchValue = e.currentTarget.value)}
			class="w-[200px]"
		/>
		<Combobox.Content class="max-h-72">
			{#if filteredItems.length === 0}
				<Combobox.Empty>No items found.</Combobox.Empty>
			{:else}
				<Combobox.Group>
					{#each filteredItems as item (item.value)}
						<Combobox.Item value={item.value} label={item.label} />
					{/each}
				</Combobox.Group>
			{/if}
		</Combobox.Content>
	</Combobox.Root>
</Example>
