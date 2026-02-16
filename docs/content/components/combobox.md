---
title: Combobox
description: Autocomplete input and command palette with a list of suggestions.
component: true
links:
  source: https://github.com/huntabyte/shadcn-svelte/tree/next/sites/docs/src/lib/registry/ui/combobox
  doc: https://bits-ui.com/docs/components/combobox
  api: https://bits-ui.com/docs/components/combobox#api-reference
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import PMInstall from "$lib/components/pm-install.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";

	let { viewerData } = $props();
	import Step from "$lib/components/step.svelte";
</script>

<ComponentPreview name="combobox-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="combobox" />
{/snippet}
{#snippet manual()}
<Steps>

<Step>

Install `bits-ui`:

</Step>

<PMInstall command="bits-ui -D" />

<Step>

Copy and paste the following code into your project.

</Step>
{#if viewerData}
	<ComponentSource item={viewerData} data-llm-ignore/>
{/if}

</Steps>
{/snippet}
</InstallTabs>

## Usage

```svelte showLineNumbers
<script lang="ts">
  import * as Combobox from "$lib/components/ui/combobox/index.js";

  const frameworks = [
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nextjs", label: "Next.js" },
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
</script>

<Combobox.Root type="single" bind:open bind:value items={frameworks}>
  <Combobox.Input
    placeholder="Search framework..."
    oninput={(e) => (searchValue = e.currentTarget.value)}
    class="w-[200px]"
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
```

## Examples

### Basic

<ComponentPreview name="combobox-demo">

<div></div>

</ComponentPreview>

### Form

<ComponentPreview name="combobox-form">

<div></div>

</ComponentPreview>
