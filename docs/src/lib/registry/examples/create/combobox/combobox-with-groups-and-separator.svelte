<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";

	const timezones = [
		{
			continent: "Americas",
			items: [
				{ value: "ny", label: "(GMT-5) New York" },
				{ value: "la", label: "(GMT-8) Los Angeles" },
				{ value: "chicago", label: "(GMT-6) Chicago" },
				{ value: "toronto", label: "(GMT-5) Toronto" },
				{ value: "vancouver", label: "(GMT-8) Vancouver" },
				{ value: "saopaulo", label: "(GMT-3) São Paulo" },
			],
		},
		{
			continent: "Europe",
			items: [
				{ value: "london", label: "(GMT+0) London" },
				{ value: "paris", label: "(GMT+1) Paris" },
				{ value: "berlin", label: "(GMT+1) Berlin" },
				{ value: "rome", label: "(GMT+1) Rome" },
				{ value: "madrid", label: "(GMT+1) Madrid" },
				{ value: "amsterdam", label: "(GMT+1) Amsterdam" },
			],
		},
		{
			continent: "Asia/Pacific",
			items: [
				{ value: "tokyo", label: "(GMT+9) Tokyo" },
				{ value: "shanghai", label: "(GMT+8) Shanghai" },
				{ value: "singapore", label: "(GMT+8) Singapore" },
				{ value: "dubai", label: "(GMT+4) Dubai" },
				{ value: "sydney", label: "(GMT+11) Sydney" },
				{ value: "seoul", label: "(GMT+9) Seoul" },
			],
		},
	];

	const allItems = timezones.flatMap((tz) => tz.items);

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const filteredTimezones = $derived(
		timezones
			.map((group) => ({
				...group,
				items: group.items.filter((item) =>
					item.label.toLowerCase().includes(searchValue.toLowerCase())
				),
			}))
			.filter((group) => group.items.length > 0)
	);

	const hasResults = $derived(filteredTimezones.length > 0);
</script>

<Example title="With Groups and Separator">
	<Combobox.Root type="single" bind:open bind:value items={allItems}>
		<Combobox.Input
			placeholder="Search timezone..."
			oninput={(e) => (searchValue = e.currentTarget.value)}
			class="w-[200px]"
		/>
		<Combobox.Content>
			{#if !hasResults}
				<Combobox.Empty>No timezones found.</Combobox.Empty>
			{:else}
				{#each filteredTimezones as group, i (group.continent)}
					{#if i > 0}
						<Combobox.Separator />
					{/if}
					<Combobox.Group>
						<Combobox.GroupHeading>{group.continent}</Combobox.GroupHeading>
						{#each group.items as item (item.value)}
							<Combobox.Item value={item.value} label={item.label} />
						{/each}
					</Combobox.Group>
				{/each}
			{/if}
		</Combobox.Content>
	</Combobox.Root>
</Example>
