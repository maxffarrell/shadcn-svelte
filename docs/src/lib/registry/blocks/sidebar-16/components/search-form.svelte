<script lang="ts">
	import SearchIcon from "@lucide/svelte/icons/search";
	import { Label } from "$lib/registry/ui/label/index.js";
	import * as Sidebar from "$lib/registry/ui/sidebar/index.js";
	import type { HTMLFormAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	let { ref = $bindable(null), ...restProps }: WithElementRef<HTMLFormAttributes> = $props();
</script>

<form {...restProps} bind:this={ref}>
	<div class="relative">
		<Label for="search" class="sr-only">Search</Label>
		<Sidebar.Input id="search" placeholder="Type to search..." class="h-8 pl-7" />
		<SearchIcon
			class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50"
		/>
	</div>
</form>
