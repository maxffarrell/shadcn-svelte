<script lang="ts">
	import { Combobox as ComboboxPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";

	let {
		ref = $bindable(null),
		class: className,
		disabled,
		showTrigger = true,
		...restProps
	}: ComboboxPrimitive.InputProps & {
		showTrigger?: boolean;
	} = $props();
</script>

<div
	data-slot="combobox-input"
	class={cn(
		"border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive flex h-9 w-full items-center rounded-md border bg-transparent text-sm shadow-xs transition-colors focus-within:ring-[3px] has-aria-invalid:ring-[3px]",
		className
	)}
>
	<ComboboxPrimitive.Input
		bind:ref
		class="placeholder:text-muted-foreground h-full flex-1 border-0 bg-transparent px-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
		{disabled}
		{...restProps}
	/>
	{#if showTrigger}
		<ComboboxPrimitive.Trigger {disabled} class="flex h-full items-center px-2">
			<IconPlaceholder
				lucide="ChevronDownIcon"
				tabler="IconChevronDown"
				hugeicons="ArrowDown01Icon"
				phosphor="CaretDownIcon"
				remixicon="RiArrowDownSLine"
				class="text-muted-foreground pointer-events-none size-4"
			/>
		</ComboboxPrimitive.Trigger>
	{/if}
</div>
