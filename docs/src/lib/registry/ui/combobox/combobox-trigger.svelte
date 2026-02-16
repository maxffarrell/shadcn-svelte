<script lang="ts">
	import { Combobox as ComboboxPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComboboxPrimitive.TriggerProps = $props();
</script>

<ComboboxPrimitive.Trigger
	bind:ref
	data-slot="combobox-trigger"
	class={cn("cn-combobox-trigger", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	<IconPlaceholder
		lucide="ChevronDownIcon"
		tabler="IconChevronDown"
		hugeicons="ArrowDown01Icon"
		phosphor="CaretDownIcon"
		remixicon="RiArrowDownSLine"
		class="cn-combobox-trigger-icon pointer-events-none"
	/>
</ComboboxPrimitive.Trigger>
