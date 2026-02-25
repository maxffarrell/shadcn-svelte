#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const COMPONENT_PREVIEW_RE = /<ComponentPreview\s+[^>]*name=["']([^"']+)["']/g;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;
const TITLE_RE = /^title:\s*(.+)$/m;
const DESCRIPTION_RE = /^description:\s*(.+)$/m;

const DEFAULT_DOCS_DIR = "docs/content/components";
const DEFAULT_EXAMPLES_DIR = "docs/src/lib/registry/examples";
const DEFAULT_BLOCKS_DIR = "docs/src/lib/registry/blocks";
const DEFAULT_OUTPUT = "parity-inventory.json";

function toPosix(p) {
	return p.split(path.sep).join("/");
}

async function exists(absPath) {
	try {
		await fs.access(absPath);
		return true;
	} catch {
		return false;
	}
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		output: null,
		pretty: true,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--repo-root") {
			options.repoRoot = path.resolve(argv[i + 1]);
			i += 1;
		} else if (arg === "--output") {
			options.output = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		} else if (arg === "--compact") {
			options.pretty = false;
		}
	}

	if (!options.output) {
		options.output = path.resolve(options.repoRoot, DEFAULT_OUTPUT);
	}

	return options;
}

function readFrontmatter(content) {
	const match = content.match(FRONTMATTER_RE);
	if (!match) return {};
	const block = match[1];
	return {
		title: block.match(TITLE_RE)?.[1]?.trim() ?? null,
		description: block.match(DESCRIPTION_RE)?.[1]?.trim() ?? null,
	};
}

function classifyPreviewName(name) {
	const lower = name.toLowerCase();
	if (lower.includes("sidebar")) return "block";
	if (lower.startsWith("chart-") && !lower.includes("demo")) return "block";
	if (lower.startsWith("calendar-") && !lower.includes("demo")) return "block";
	return "example";
}

function buildUpstreamExampleCandidates(name) {
	const candidates = new Set([name]);
	if (name.endsWith("-demo")) candidates.add(name.slice(0, -5));
	else candidates.add(`${name}-demo`);
	if (name.endsWith("-example")) candidates.add(name.slice(0, -8));
	return [...candidates];
}

function uniqueCountMap(values) {
	const map = new Map();
	for (const value of values) {
		map.set(value, (map.get(value) ?? 0) + 1);
	}
	return map;
}

function extractComponentPreviews(content) {
	const names = [];
	for (const match of content.matchAll(COMPONENT_PREVIEW_RE)) {
		names.push(match[1]);
	}
	return uniqueCountMap(names);
}

async function resolvePreviewLocation(name, repoRoot) {
	const kind = classifyPreviewName(name);
	const examplePath = path.resolve(repoRoot, DEFAULT_EXAMPLES_DIR, `${name}.svelte`);
	const blockFilePath = path.resolve(repoRoot, DEFAULT_BLOCKS_DIR, `${name}.svelte`);
	const blockPagePath = path.resolve(repoRoot, DEFAULT_BLOCKS_DIR, name, "+page.svelte");

	if (kind === "example") {
		return {
			localType: "example",
			localPath: toPosix(path.relative(repoRoot, examplePath)),
			localExists: await exists(examplePath),
			candidates: [toPosix(path.relative(repoRoot, examplePath))],
		};
	}

	if (await exists(blockFilePath)) {
		return {
			localType: "block",
			localPath: toPosix(path.relative(repoRoot, blockFilePath)),
			localExists: true,
			candidates: [
				toPosix(path.relative(repoRoot, blockFilePath)),
				toPosix(path.relative(repoRoot, blockPagePath)),
			],
		};
	}

	return {
		localType: "block",
		localPath: toPosix(path.relative(repoRoot, blockPagePath)),
		localExists: await exists(blockPagePath),
		candidates: [
			toPosix(path.relative(repoRoot, blockFilePath)),
			toPosix(path.relative(repoRoot, blockPagePath)),
		],
	};
}

export async function buildInventory({ repoRoot = process.cwd() } = {}) {
	const docsDirAbs = path.resolve(repoRoot, DEFAULT_DOCS_DIR);
	const docEntries = (await fs.readdir(docsDirAbs, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
		.map((entry) => entry.name)
		.sort();

	const components = [];
	for (const docFile of docEntries) {
		const docAbsPath = path.join(docsDirAbs, docFile);
		const content = await fs.readFile(docAbsPath, "utf8");
		const slug = docFile.replace(/\.md$/, "");
		const { title, description } = readFrontmatter(content);
		const previewCounts = extractComponentPreviews(content);

		const exampleRefs = [];
		for (const [name, occurrences] of previewCounts.entries()) {
			const local = await resolvePreviewLocation(name, repoRoot);
			exampleRefs.push({
				name,
				occurrences,
				...local,
				upstreamExampleCandidates: buildUpstreamExampleCandidates(name),
				upstreamExampleUrlCandidates: buildUpstreamExampleCandidates(name).map(
					(candidate) =>
						`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/${candidate}.tsx`
				),
			});
		}

		components.push({
			slug,
			title,
			description,
			docPath: toPosix(path.relative(repoRoot, docAbsPath)),
			upstreamDocSlug: slug,
			upstreamDocUrlCandidates: [
				`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/${slug}.mdx`,
				`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/${slug}.md`,
			],
			exampleRefs,
		});
	}

	const previewRefCount = components.reduce(
		(total, component) =>
			total + component.exampleRefs.reduce((sum, ref) => sum + ref.occurrences, 0),
		0
	);
	const uniquePreviewNames = new Set(
		components.flatMap((component) => component.exampleRefs.map((ref) => ref.name))
	).size;
	const unresolvedLocalPaths = components
		.flatMap((component) =>
			component.exampleRefs
				.filter((ref) => !ref.localExists)
				.map((ref) => `${component.slug}:${ref.name}`)
		)
		.sort();

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		repoRoot: toPosix(path.resolve(repoRoot)),
		paths: {
			docsDir: DEFAULT_DOCS_DIR,
			examplesDir: DEFAULT_EXAMPLES_DIR,
			blocksDir: DEFAULT_BLOCKS_DIR,
		},
		components,
		summary: {
			componentDocCount: components.length,
			previewReferenceCount: previewRefCount,
			uniquePreviewCount: uniquePreviewNames,
			unresolvedLocalPathCount: unresolvedLocalPaths.length,
			unresolvedLocalPaths,
		},
	};
}

async function runCli() {
	const options = parseArgs(process.argv.slice(2));
	const inventory = await buildInventory({ repoRoot: options.repoRoot });
	await fs.mkdir(path.dirname(options.output), { recursive: true });
	await fs.writeFile(
		options.output,
		JSON.stringify(inventory, null, options.pretty ? 2 : 0) + "\n",
		"utf8"
	);
	process.stdout.write(
		`Inventory written: ${toPosix(path.relative(options.repoRoot, options.output))}\n`
	);
	process.stdout.write(
		`Docs: ${inventory.summary.componentDocCount}, Preview refs: ${inventory.summary.previewReferenceCount}\n`
	);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	runCli().catch((error) => {
		process.stderr.write(`${error?.stack ?? String(error)}\n`);
		process.exit(1);
	});
}

export { buildUpstreamExampleCandidates, classifyPreviewName };
