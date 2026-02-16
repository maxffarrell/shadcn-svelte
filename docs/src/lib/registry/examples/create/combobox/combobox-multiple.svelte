<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
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
	let values = $state<string[]>(["nextjs"]);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const selectedLabels = $derived(
		frameworks.filter((f) => values.includes(f.value)).map((f) => f.label)
	);

	function removeValue(e: MouseEvent, index: number) {
		e.stopPropagation();
		values = values.filter((_, i) => i !== index);
	}
</script>

<Example title="Combobox Multiple">
	<div class="flex flex-col gap-2">
		{#if selectedLabels.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each selectedLabels as label, i (label)}
					<Badge
						variant="secondary"
						class="gap-1 pr-0.5"
						onclick={(e) => removeValue(e, i)}
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
</Example>
