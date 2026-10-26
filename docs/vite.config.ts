// @ts-check
import { mdsx } from "mdsx";

import adapter from "@sveltejs/adapter-cloudflare";
import MagicString from "magic-string";
import { mdsxConfig } from "./mdsx.config.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { build } from "./scripts/build-registry.js";
import { visualizer } from "rollup-plugin-visualizer";
import { enhancedImages } from "@sveltejs/enhanced-img";
import packageJson from "./package.json" with { type: "json" };

// don't build when we're running `vite preview`
if (!process.argv.includes("preview")) {
	console.log("Building registry...");
	await buildRegistry();
	console.log("Registry built.");
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const veliteDirPath = path.join(__dirname, ".velite");
export const staticDirPath = path.join(__dirname, "src/registry/json");
export const contentDirPath = path.join(__dirname, "content");
export const ogDirPath = path.join(__dirname, "src/routes/og");

/**
 * Detects the `name` of the previewing component, imports it directly and
 * passes it to the `ComponentPreview` as a prop.
 * @returns {import("svelte/compiler").PreprocessorGroup}
 */
function componentPreviews(): import("svelte/compiler").PreprocessorGroup {
	const TARGET = "<ComponentPreview";
	const camelize = (s: string) => s.replace(/-./g, (w) => w[1].toUpperCase());

	return {
		name: "inject-component-preview",
		markup: ({ content, filename }) => {
			if (!filename?.endsWith(".md") || !content.includes(TARGET)) return;

			const ms = new MagicString(content);
			const results = content.matchAll(/<ComponentPreview name=["|']([^\s]*)["|']/g);
			const components = new Set<string>();

			for (const exec of results) {
				const [, name] = exec;
				const insertIndex = exec.index + TARGET.length;
				const identifier = camelize(name);

				if (name.includes("sidebar")) continue;

				const prop = ` component={${identifier}}`;

				ms.appendRight(insertIndex, prop);
				components.add(name);
			}

			const importIndex = content.search("import ComponentPreview");

			for (const name of components) {
				const identifier = camelize(name);
				let importStatement;

				if (name.startsWith("chart") && !name.includes("demo")) {
					importStatement = `import ${identifier} from "#lib/registry/blocks/${name}.svelte";`;
				} else if (name.includes("sidebar") || name.includes("Sidebar")) {
					continue;
				} else if (name.startsWith("calendar") && !name.includes("demo")) {
					importStatement = `import ${identifier} from "#lib/registry/blocks/${name}.svelte";`;
				} else {
					importStatement = `import ${identifier} from "#lib/registry/examples/${name}.svelte";`;
				}

				ms.appendLeft(importIndex, importStatement);
			}

			return { code: ms.toString(), map: ms.generateMap() };
		},
	};
}

export default defineConfig({
	resolve: {
		// Use the browser implementation everywhere so SSR/Workers bundles avoid the Node
		// `canvas` server build (main → lib/server) and so `qrcode` can be inlined into
		// the Cloudflare worker instead of remaining a bare external import.
		alias: {
			qrcode: "qrcode/lib/browser.js",
		},
	},
	plugins: [
		!process.env.CI &&
			visualizer({
				emitFile: true,
				filename: "stats.html",
			}),
		tailwindcss(),
		enhancedImages(),
		sveltekit({
			preprocess: [mdsx(mdsxConfig), componentPreviews()],
			extensions: [".svelte", ".md"],
			// https://kit.svelte.dev/docs/adapter-cloudflare#options
			adapter: adapter(),

			prerender: {
				handleMissingId: (details) => {
					if (details.id === "#") return;

					console.warn(details.message);
				},

				handleHttpError: (details) => {
					// TODO: remove once all referenced pages are added
					console.warn(details.message);
				},
			},
		}),
	],
	server: {
		fs: {
			allow: [veliteDirPath, staticDirPath, contentDirPath, ogDirPath],
		},
	},
	build: {
		// minify: false,
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{ test: /node_modules\/@lucide\/svelte/, name: "lucide-icons" },
						{
							test: /node_modules\/@tabler\/icons-svelte/,
							name: "tabler-icons",
						},
						{ test: /node_modules\/@hugeicons\/svelte/, name: "hugeicons" },
						{
							test: /node_modules\/@hugeicons\/core-free-icons/,
							name: "hugeicons-core-free-icons",
						},
						{
							test: /node_modules\/phosphor-svelte/,
							name: "phosphor-icons",
						},
						{
							test: /node_modules\/remixicon-svelte/,
							name: "remixicon-icons",
						},
					],
				},
			},
		},
	},
	ssr: {
		noExternal: Object.keys(packageJson.devDependencies),
	},
});

async function buildRegistry() {
	await build();
	fs.cpSync(path.resolve("static", "registry"), path.resolve("src", "__registry__", "json"), {
		recursive: true,
	});
}
