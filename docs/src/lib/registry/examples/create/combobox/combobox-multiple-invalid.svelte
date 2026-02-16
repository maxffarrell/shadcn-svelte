<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
	import * as Field from "$lib/registry/ui/field/index.js";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";

	const frameworks = [
		{ value: "nextjs", label: "Next.js" },
		{ value: "sveltekit", label: "SvelteKit" },
		{ value: "nuxtjs", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let open = $state(false);
	let values = $state<string[]>(["nextjs", "sveltekit"]);
	let searchValue = $state("");

	let openInvalid = $state(false);
	let valuesInvalid = $state<string[]>(["nextjs", "sveltekit", "nuxtjs"]);
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

	const selectedLabels = $derived(
		frameworks.filter((f) => values.includes(f.value)).map((f) => f.label)
	);

	const selectedLabelsInvalid = $derived(
		frameworks.filter((f) => valuesInvalid.includes(f.value)).map((f) => f.label)
	);

	function removeValue(e: MouseEvent, index: number, target: "default" | "invalid") {
		e.stopPropagation();
		if (target === "default") {
			values = values.filter((_, i) => i !== index);
		} else {
			valuesInvalid = valuesInvalid.filter((_, i) => i !== index);
		}
	}
</script>

<Example title="Combobox Multiple Invalid">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			{#if selectedLabels.length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each selectedLabels as label, i (label)}
						<Badge
							variant="secondary"
							class="gap-1 pr-0.5"
							onclick={(e) => removeValue(e, i, "default")}
						>
							{label}
							<IconPlaceholder
								lucide="XIcon"
								tabler="IconX"
								hugeicons="Cancel01Icon"
								phosphor="XIcon"
								remixicon="RiCloseLine"
								class="size-3"
							/>
						</Badge>
					{/each}
				</div>
			{/if}
			<Combobox.Root type="multiple" bind:open bind:value={values} items={frameworks}>
				<Combobox.Input
					placeholder="Select frameworks..."
					oninput={(e) => (searchValue = e.currentTarget.value)}
					class="w-64"
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
		</div>

		<Field.Field data-invalid>
			<Field.Label for="combobox-multiple-invalid">Frameworks</Field.Label>
			<div class="flex flex-col gap-2">
				{#if selectedLabelsInvalid.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each selectedLabelsInvalid as label, i (label)}
							<Badge
								variant="secondary"
								class="gap-1 pr-0.5"
								onclick={(e) => removeValue(e, i, "invalid")}
							>
								{label}
								<IconPlaceholder
									lucide="XIcon"
									tabler="IconX"
									hugeicons="Cancel01Icon"
									phosphor="XIcon"
									remixicon="RiCloseLine"
									class="size-3"
								/>
							</Badge>
						{/each}
					</div>
				{/if}
				<Combobox.Root
					type="multiple"
					bind:open={openInvalid}
					bind:value={valuesInvalid}
					items={frameworks}
				>
					<Combobox.Input
						placeholder="Select frameworks..."
						oninput={(e) => (searchValueInvalid = e.currentTarget.value)}
						class="w-64"
						aria-invalid
						id="combobox-multiple-invalid"
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
			</div>
			<Field.Description>Please select at least one framework.</Field.Description>
			<Field.Error errors={[{ message: "This field is required." }]} />
		</Field.Field>
	</div>
</Example>
