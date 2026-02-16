<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
	import * as Item from "$lib/registry/ui/item/index.js";

	const countries = [
		{ code: "us", value: "united-states", label: "United States", continent: "North America" },
		{ code: "gb", value: "united-kingdom", label: "United Kingdom", continent: "Europe" },
		{ code: "ca", value: "canada", label: "Canada", continent: "North America" },
		{ code: "au", value: "australia", label: "Australia", continent: "Oceania" },
		{ code: "de", value: "germany", label: "Germany", continent: "Europe" },
		{ code: "fr", value: "france", label: "France", continent: "Europe" },
		{ code: "jp", value: "japan", label: "Japan", continent: "Asia" },
		{ code: "cn", value: "china", label: "China", continent: "Asia" },
		{ code: "br", value: "brazil", label: "Brazil", continent: "South America" },
		{ code: "in", value: "india", label: "India", continent: "Asia" },
	];

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? countries
			: countries.filter((c) =>
					c.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const selectedLabel = $derived(
		countries.find((c) => c.value === value)?.label ?? "Search countries..."
	);
</script>

<Example title="With Custom Item Rendering">
	<Combobox.Root type="single" bind:open bind:value items={countries}>
		<Combobox.Input
			placeholder={selectedLabel}
			oninput={(e) => (searchValue = e.currentTarget.value)}
			class="w-[280px]"
		/>
		<Combobox.Content class="w-[280px]">
			{#if filteredItems.length === 0}
				<Combobox.Empty>No countries found.</Combobox.Empty>
			{:else}
				<Combobox.Group>
					{#each filteredItems as country (country.code)}
						<Combobox.Item value={country.value}>
							{#snippet children(props)}
								<Item.Root size="xs" class="p-0">
									<Item.Content>
										<Item.Title class="whitespace-nowrap">{country.label}</Item.Title>
										<Item.Description>
											{country.continent} ({country.code})
										</Item.Description>
									</Item.Content>
								</Item.Root>
							{/snippet}
						</Combobox.Item>
					{/each}
				</Combobox.Group>
			{/if}
		</Combobox.Content>
	</Combobox.Root>
</Example>
