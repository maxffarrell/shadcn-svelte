<script lang="ts" module>
	import { z } from "zod";

	const languages = [
		{ label: "English", value: "en" },
		{ label: "French", value: "fr" },
		{ label: "German", value: "de" },
		{ label: "Spanish", value: "es" },
		{ label: "Portuguese", value: "pt" },
		{ label: "Russian", value: "ru" },
		{ label: "Japanese", value: "ja" },
		{ label: "Korean", value: "ko" },
		{ label: "Chinese", value: "zh" },
	];

	const formSchema = z.object({
		language: z.enum(["en", "fr", "de", "es", "pt", "ru", "ja", "ko", "zh"]),
	});
</script>

<script lang="ts">
	import { defaults, superForm } from "sveltekit-superforms";
	import { zod4 } from "sveltekit-superforms/adapters";
	import { toast } from "svelte-sonner";
	import { useId } from "bits-ui";
	import * as Form from "$lib/registry/ui/form/index.js";
	import * as Combobox from "$lib/registry/ui/combobox/index.js";

	const form = superForm(defaults(zod4(formSchema)), {
		validators: zod4(formSchema),
		SPA: true,
		onUpdate: ({ form: f }) => {
			if (f.valid) {
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
			} else {
				toast.error("Please fix the errors in the form.");
			}
		},
	});

	const { form: formData, enhance } = form;

	let open = $state(false);
	let searchValue = $state("");

	const filteredItems = $derived(
		searchValue === ""
			? languages
			: languages.filter((l) =>
					l.label.toLowerCase().includes(searchValue.toLowerCase())
				)
	);

	const selectedLabel = $derived(
		languages.find((l) => l.value === $formData.language)?.label ?? "Select language"
	);

	const triggerId = useId();
</script>

<form method="POST" class="space-y-6" use:enhance>
	<Form.Field {form} name="language" class="flex flex-col">
		<Combobox.Root
			type="single"
			bind:open
			bind:value={$formData.language}
			items={languages}
		>
			<Form.Control id={triggerId}>
				{#snippet children({ props })}
					<Form.Label>Language</Form.Label>
					<Combobox.Input
						placeholder={selectedLabel}
						oninput={(e) => (searchValue = e.currentTarget.value)}
						class="w-[200px]"
						{...props}
					/>
					<input hidden value={$formData.language} name={props.name} />
				{/snippet}
			</Form.Control>
			<Combobox.Content>
				{#if filteredItems.length === 0}
					<Combobox.Empty>No language found.</Combobox.Empty>
				{:else}
					<Combobox.Group>
						{#each filteredItems as language (language.value)}
							<Combobox.Item value={language.value} label={language.label} />
						{/each}
					</Combobox.Group>
				{/if}
			</Combobox.Content>
		</Combobox.Root>
		<Form.Description>
			This is the language that will be used in the dashboard.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Submit</Form.Button>
</form>
