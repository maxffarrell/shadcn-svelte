<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
	import * as Field from "$lib/registry/ui/field/index.js";

	const frameworks = [
		{ value: "nextjs", label: "Next.js" },
		{ value: "sveltekit", label: "SvelteKit" },
		{ value: "nuxtjs", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let open = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	let openInvalid = $state(false);
	let valueInvalid = $state<string | undefined>(undefined);
	let searchValueInvalid = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const filteredItemsInvalid = $derived(
		searchValueInvalid === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValueInvalid.toLowerCase())
				)
	);
</script>

<Example title="Invalid">
	<div class="flex flex-col gap-4">
		<Combobox.Root type="single" bind:open bind:value items={frameworks}>
			<Combobox.Input
				placeholder="Search framework..."
				oninput={(e) => (searchValue = e.currentTarget.value)}
				class="w-[200px]"
				aria-invalid="true"
			/>
			<Combobox.Content>
				{#if filteredItems.length === 0}
					<Combobox.Empty>No items found.</Combobox.Empty>
				{:else}
					<Combobox.Group>
						{#each filteredItems as framework (framework.value)}
							<Combobox.Item value={framework.value} label={framework.label} />
						{/each}
					</Combobox.Group>
				{/if}
			</Combobox.Content>
		</Combobox.Root>

		<Field.Field data-invalid>
			<Field.Label for="combobox-framework-invalid">Framework</Field.Label>
			<Combobox.Root
				type="single"
				bind:open={openInvalid}
				bind:value={valueInvalid}
				items={frameworks}
			>
				<Combobox.Input
					placeholder="Search framework..."
					oninput={(e) => (searchValueInvalid = e.currentTarget.value)}
					class="w-[200px]"
					aria-invalid
					id="combobox-framework-invalid"
				/>
				<Combobox.Content>
					{#if filteredItemsInvalid.length === 0}
						<Combobox.Empty>No items found.</Combobox.Empty>
					{:else}
						<Combobox.Group>
							{#each filteredItemsInvalid as framework (framework.value)}
								<Combobox.Item value={framework.value} label={framework.label} />
							{/each}
						</Combobox.Group>
					{/if}
				</Combobox.Content>
			</Combobox.Root>
			<Field.Description>Please select a valid framework.</Field.Description>
			<Field.Error errors={[{ message: "This field is required." }]} />
		</Field.Field>
	</div>
</Example>
