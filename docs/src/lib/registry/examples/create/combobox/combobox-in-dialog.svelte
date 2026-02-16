<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Dialog from "$lib/registry/ui/dialog/index.js";
	import * as Field from "$lib/registry/ui/field/index.js";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { toast } from "svelte-sonner";

	const frameworks = [
		{ value: "nextjs", label: "Next.js" },
		{ value: "sveltekit", label: "SvelteKit" },
		{ value: "nuxtjs", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let dialogOpen = $state(false);
	let comboboxOpen = $state(false);
	let value = $state<string | undefined>(undefined);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? frameworks
			: frameworks.filter((f) =>
					f.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const selectedLabel = $derived(
		frameworks.find((f) => f.value === value)?.label ?? "Select a framework"
	);
</script>

<Example title="Combobox in Dialog">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button variant="outline" {...props}>Open Dialog</Button>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Select Framework</Dialog.Title>
				<Dialog.Description>
					Choose your preferred framework from the list below.
				</Dialog.Description>
			</Dialog.Header>
			<Field.Field>
				<Field.Label for="framework-dialog" class="sr-only">Framework</Field.Label>
				<Combobox.Root type="single" bind:open={comboboxOpen} bind:value items={frameworks}>
					<Combobox.Input
						placeholder={selectedLabel}
						oninput={(e) => (searchValue = e.currentTarget.value)}
						class="w-full"
						id="framework-dialog"
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
			</Field.Field>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button
					type="button"
					onclick={() => {
						toast("Framework selected.");
						dialogOpen = false;
					}}
				>
					Confirm
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</Example>
