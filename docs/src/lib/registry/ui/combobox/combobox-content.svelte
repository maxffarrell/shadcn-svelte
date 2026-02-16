<script lang="ts">
	import { Combobox as ComboboxPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		align = "start",
		children,
		preventScroll = true,
		...restProps
	}: WithoutChild<ComboboxPrimitive.ContentProps> = $props();
</script>

<ComboboxPrimitive.Portal>
	<ComboboxPrimitive.Content
		bind:ref
		{sideOffset}
		{align}
		{preventScroll}
		data-slot="combobox-content"
		class={cn(
			"cn-combobox-content cn-menu-target group/combobox-content relative isolate z-50 w-(--bits-combobox-anchor-width) min-w-[calc(var(--bits-combobox-anchor-width)+theme(spacing.7))] origin-(--bits-combobox-content-transform-origin)",
			className
		)}
		{...restProps}
	>
		<ComboboxPrimitive.Viewport class="cn-combobox-list">
			{@render children?.()}
		</ComboboxPrimitive.Viewport>
	</ComboboxPrimitive.Content>
</ComboboxPrimitive.Portal>
