<script lang="ts">
	import Example from "../../../../../routes/(app)/(layout)/(create)/components/example.svelte";
	import * as Card from "$lib/registry/ui/card/index.js";
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

	const selectedLabel = $derived(
		frameworks.find((f) => f.value === value)?.label ?? "Select a framework"
	);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const framework = formData.get("framework") as string;
		const frameworkLabel = frameworks.find((f) => f.value === framework)?.label;
		toast(`You selected ${frameworkLabel} as your framework.`);
	}
</script>

<Example title="Form with Combobox">
	<Card.Root class="w-full max-w-sm" size="sm">
		<Card.Content>
			<form id="form-with-combobox" class="w-full" onsubmit={handleSubmit}>
				<Field.Group>
					<Field.Field>
						<Field.Label for="framework">Framework</Field.Label>
						<div class="relative">
							<input type="hidden" name="framework" value={value} />
							<Combobox.Root type="single" bind:open bind:value items={frameworks}>
								<Combobox.Input
									placeholder={selectedLabel}
									oninput={(e) => (searchValue = e.currentTarget.value)}
									class="w-full"
									id="framework"
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
												/>
											{/each}
										</Combobox.Group>
									{/if}
								</Combobox.Content>
							</Combobox.Root>
						</div>
					</Field.Field>
				</Field.Group>
			</form>
		</Card.Content>
		<Card.Footer>
			<Button type="submit" form="form-with-combobox">Submit</Button>
		</Card.Footer>
	</Card.Root>
</Example>
