<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";

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
	let value = $state<string>("united-states");
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? countries
			: countries.filter((c) =>
					c.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const selectedLabel = $derived(
		countries.find((c) => c.value === value)?.label ?? "Select country"
	);
</script>

<Example title="Combobox in Popup">
	<Combobox.Root type="single" bind:open bind:value items={countries}>
		<Combobox.Trigger>
			<Button variant="outline" class="w-64 justify-between font-normal">
				{selectedLabel}
			</Button>
		</Combobox.Trigger>
		<Combobox.Content>
			<Combobox.Input
				placeholder="Search"
				oninput={(e) => (searchValue = e.currentTarget.value)}
			/>
			{#if filteredItems.length === 0}
				<Combobox.Empty>No items found.</Combobox.Empty>
			{:else}
				<Combobox.Group>
					{#each filteredItems as country (country.code)}
						<Combobox.Item value={country.value} label={country.label} />
					{/each}
				</Combobox.Group>
			{/if}
		</Combobox.Content>
	</Combobox.Root>
</Example>
