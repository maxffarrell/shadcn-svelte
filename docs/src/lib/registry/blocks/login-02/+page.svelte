<script lang="ts">
	import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
	import LoginForm from "./components/login-form.svelte";
</script>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href="##" class="flex items-center gap-2 font-medium">
				<div
					class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
				>
					<GalleryVerticalEndIcon class="size-4" />
				</div>
				Acme Inc.
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<LoginForm />
			</div>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">
		<img
			src="/placeholder.svg"
			alt="placeholder"
			class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
		/>
	</div>
</div>
