#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildInventory, buildUpstreamExampleCandidates } from "./inventory.mjs";
import { renderReportMarkdown } from "./render-report.mjs";

const COMPONENT_PREVIEW_RE = /<ComponentPreview\s+[^>]*name=["']([^"']+)["']/g;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;
const DESCRIPTION_RE = /^description:\s*(.+)$/m;
const UPSTREAM_TREE_API = "https://api.github.com/repos/shadcn-ui/ui/git/trees/main?recursive=1";
const UPSTREAM_RAW_PREFIX = "https://raw.githubusercontent.com/shadcn-ui/ui/main/";
const UPSTREAM_DOC_PREFIX = "apps/v4/content/docs/components/radix/";
const UPSTREAM_EXAMPLE_PREFIX = "apps/v4/examples/radix/";

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

function unique(values) {
	return [...new Set(values)];
}

function normalizeExampleName(name) {
	return name.toLowerCase().replace(/-demo$/, "").replace(/[^a-z0-9]/g, "");
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		mode: "repair",
		offline: false,
		rewriteDivergentExamples: false,
		inventoryPath: null,
		reportPath: null,
		markdownPath: null,
		componentFilter: null,
		maxComponents: Number.POSITIVE_INFINITY,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--repo-root") {
			options.repoRoot = path.resolve(argv[i + 1]);
			i += 1;
		} else if (arg === "--mode") {
			options.mode = argv[i + 1] === "audit" ? "audit" : "repair";
			i += 1;
		} else if (arg === "--offline") {
			options.offline = true;
		} else if (arg === "--rewrite-divergent-examples") {
			options.rewriteDivergentExamples = true;
		} else if (arg === "--inventory") {
			options.inventoryPath = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		} else if (arg === "--report") {
			options.reportPath = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		} else if (arg === "--markdown") {
			options.markdownPath = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		} else if (arg === "--component") {
			options.componentFilter = new Set(
				argv[i + 1]
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean)
			);
			i += 1;
		} else if (arg === "--max-components") {
			options.maxComponents = Number.parseInt(argv[i + 1], 10);
			i += 1;
		}
	}

	options.inventoryPath ||= path.resolve(
		options.repoRoot,
		"parity-inventory.json"
	);
	options.reportPath ||= path.resolve(options.repoRoot, "parity-report.json");
	options.markdownPath ||= path.resolve(options.repoRoot, "parity-report.md");
	return options;
}

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: {
			accept: "application/vnd.github+json",
			"user-agent": "shadcn-radix-parity-skill",
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

async function fetchText(url) {
	const response = await fetch(url, {
		headers: {
			"user-agent": "shadcn-radix-parity-skill",
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

async function fetchGitIndexes() {
	const treeResponse = await fetchJson(UPSTREAM_TREE_API);
	const treeNodes = Array.isArray(treeResponse.tree) ? treeResponse.tree : [];
	const docs = new Map();
	const examples = new Map();
	const normalizedExamples = new Map();

	for (const node of treeNodes) {
		if (node.type !== "blob" || typeof node.path !== "string") continue;

		if (
			node.path.startsWith(UPSTREAM_DOC_PREFIX) &&
			(node.path.endsWith(".mdx") || node.path.endsWith(".md"))
		) {
			const slug = path.basename(node.path).replace(/\.(mdx|md)$/, "");
			if (!docs.has(slug)) {
				docs.set(slug, {
					slug,
					path: node.path,
					rawUrl: `${UPSTREAM_RAW_PREFIX}${node.path}`,
				});
			}
			continue;
		}

		if (node.path.startsWith(UPSTREAM_EXAMPLE_PREFIX) && node.path.endsWith(".tsx")) {
			const name = path.basename(node.path, ".tsx");
			if (!examples.has(name)) {
				examples.set(name, {
					name,
					path: node.path,
					rawUrl: `${UPSTREAM_RAW_PREFIX}${node.path}`,
				});
			}

			const normalized = normalizeExampleName(name);
			const bucket = normalizedExamples.get(normalized) ?? [];
			bucket.push(name);
			normalizedExamples.set(normalized, bucket);
		}
	}

	return { docs, examples, normalizedExamples };
}

function stripFrontmatter(markdown) {
	return markdown.replace(FRONTMATTER_RE, "");
}

function extractDescription(markdown) {
	const frontmatterMatch = markdown.match(FRONTMATTER_RE);
	if (!frontmatterMatch) return null;
	return frontmatterMatch[1].match(DESCRIPTION_RE)?.[1]?.trim() ?? null;
}

function extractHeadings(markdown) {
	const headings = [];
	const cleaned = stripFrontmatter(markdown);
	for (const match of cleaned.matchAll(/^##+\s+(.+)$/gm)) {
		headings.push(match[1].trim());
	}
	return headings;
}

function extractPreviewNames(markdown) {
	return unique([...markdown.matchAll(COMPONENT_PREVIEW_RE)].map((match) => match[1]));
}

function normalizeHeading(heading) {
	return heading.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

function compareDocParity(localMarkdown, upstreamMarkdown) {
	const localDescription = extractDescription(localMarkdown);
	const upstreamDescription = extractDescription(upstreamMarkdown);
	const localHeadings = extractHeadings(localMarkdown);
	const upstreamHeadings = extractHeadings(upstreamMarkdown);
	const localHeadingMap = new Map(localHeadings.map((h) => [normalizeHeading(h), h]));
	const upstreamHeadingMap = new Map(upstreamHeadings.map((h) => [normalizeHeading(h), h]));

	const missingHeadings = [];
	for (const [key, heading] of upstreamHeadingMap.entries()) {
		if (!localHeadingMap.has(key)) missingHeadings.push(heading);
	}

	const extraHeadings = [];
	for (const [key, heading] of localHeadingMap.entries()) {
		if (!upstreamHeadingMap.has(key)) extraHeadings.push(heading);
	}

	const localPreviews = extractPreviewNames(localMarkdown);
	const upstreamPreviews = extractPreviewNames(upstreamMarkdown);
	const missingPreviewNames = upstreamPreviews.filter((name) => !localPreviews.includes(name));
	const extraPreviewNames = localPreviews.filter((name) => !upstreamPreviews.includes(name));

	return {
		localDescription,
		upstreamDescription,
		missingHeadings,
		extraHeadings,
		missingPreviewNames,
		extraPreviewNames,
	};
}

function replaceDescription(markdown, description) {
	const frontmatterMatch = markdown.match(FRONTMATTER_RE);
	if (!frontmatterMatch) return { changed: false, content: markdown };
	const frontmatter = frontmatterMatch[1];
	if (!DESCRIPTION_RE.test(frontmatter)) return { changed: false, content: markdown };

	const nextFrontmatter = frontmatter.replace(DESCRIPTION_RE, `description: ${description}`);
	if (nextFrontmatter === frontmatter) return { changed: false, content: markdown };

	const content = markdown.replace(FRONTMATTER_RE, `---\n${nextFrontmatter}\n---\n`);
	return { changed: true, content };
}

function slugToTitle(slug) {
	return slug
		.split("-")
		.filter(Boolean)
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join(" ");
}

function renderPreviewBlock(name) {
	return `### ${slugToTitle(name)}

<ComponentPreview name="${name}">

<div></div>

</ComponentPreview>`;
}

function insertMissingExampleBlocks(markdown, missingPreviewNames) {
	if (missingPreviewNames.length === 0) return { changed: false, content: markdown };
	const examplesHeading = markdown.match(/^##\s+Examples\s*$/m);
	if (!examplesHeading || typeof examplesHeading.index !== "number") {
		return { changed: false, content: markdown };
	}

	const headingEnd = examplesHeading.index + examplesHeading[0].length;
	const remainder = markdown.slice(headingEnd);
	const nextSection = remainder.match(/\n##\s+/);
	const insertionPoint = nextSection ? headingEnd + nextSection.index : markdown.length;
	const block = missingPreviewNames.map((name) => renderPreviewBlock(name)).join("\n\n");

	const before = markdown.slice(0, insertionPoint).replace(/\s+$/, "");
	const after = markdown.slice(insertionPoint).replace(/^\s+/, "");
	const nextContent = `${before}\n\n${block}\n\n${after}`.replace(/\n{3,}/g, "\n\n");
	if (nextContent === markdown) return { changed: false, content: markdown };
	return { changed: true, content: nextContent.endsWith("\n") ? nextContent : `${nextContent}\n` };
}

function extractClassTokens(code) {
	const tokens = [];
	const direct = /(?:class|className)\s*=\s*["'`]([^"'`]+)["'`]/g;
	const wrapped = /(?:class|className)\s*=\s*\{[^}]*?["'`]([^"'`]+)["'`][^}]*\}/g;

	for (const match of code.matchAll(direct)) tokens.push(...match[1].split(/\s+/));
	for (const match of code.matchAll(wrapped)) tokens.push(...match[1].split(/\s+/));

	return new Set(tokens.filter(Boolean));
}

function jaccardScore(setA, setB) {
	if (setA.size === 0 && setB.size === 0) return 1;
	const intersection = [...setA].filter((token) => setB.has(token)).length;
	const union = new Set([...setA, ...setB]).size;
	return union === 0 ? 1 : intersection / union;
}

function compareExampleParity(localSvelte, upstreamTsx) {
	const functional = [];
	const visual = [];
	const localLower = localSvelte.toLowerCase();
	const upstreamLower = upstreamTsx.toLowerCase();

	const checks = [
		{
			name: "keyboard behavior",
			upstream: /onKey(?:Down|Up|Press)|Arrow(?:Up|Down|Left|Right)|Escape|Enter|Tab/,
			local: /on:keydown|onkeydown|on:keyup|onkeyup|arrow(?:up|down|left|right)|escape|enter|tab/,
			note: "Upstream includes keyboard behavior that was not found in local Svelte example.",
		},
		{
			name: "focus behavior",
			upstream: /onFocus|onBlur|autoFocus|focus\(/,
			local: /on:focus|onfocus|on:blur|onblur|autofocus|focus\(/,
			note: "Upstream includes explicit focus behavior that was not found locally.",
		},
		{
			name: "aria and role attributes",
			upstream: /aria-|role=/,
			local: /aria-|role=/,
			note: "Upstream includes ARIA/role attributes not found in local example.",
		},
	];

	for (const check of checks) {
		if (check.upstream.test(upstreamTsx) && !check.local.test(localSvelte)) {
			functional.push(check.note);
		}
	}

	const upstreamClassTokens = extractClassTokens(upstreamTsx);
	const localClassTokens = extractClassTokens(localSvelte);
	const classSimilarity = jaccardScore(localClassTokens, upstreamClassTokens);

	if (upstreamClassTokens.size >= 8 && classSimilarity < 0.35) {
		visual.push(
			`Class token similarity is low (${classSimilarity.toFixed(2)}); local styling likely diverges from upstream intent.`
		);
	}

	if (upstreamLower.includes("variant") && !localLower.includes("variant")) {
		visual.push("Upstream example uses variants that are not visible in the local example.");
	}

	return {
		functional,
		visual,
		classSimilarity,
		divergent: functional.length > 0 || visual.length > 0,
	};
}

function detectUnsupportedTsx(tsxSource) {
	const unsupported = [];
	if (/\{[^}]*\.map\(/s.test(tsxSource)) {
		unsupported.push("JSX map loops require manual conversion to Svelte each blocks.");
	}
	if (/\b(useEffect|useLayoutEffect|useMemo|useCallback|useRef)\b/.test(tsxSource)) {
		unsupported.push("React hook usage requires manual Svelte state/lifecycle conversion.");
	}
	if (/\bforwardRef\b|React\.forwardRef/.test(tsxSource)) {
		unsupported.push("forwardRef patterns require manual Svelte ref adaptation.");
	}
	return unsupported;
}

function extractDefaultFunctionBody(source) {
	const marker = "export default function";
	const start = source.indexOf(marker);
	if (start === -1) return null;
	const braceStart = source.indexOf("{", start);
	if (braceStart === -1) return null;

	let depth = 0;
	let braceEnd = -1;
	for (let i = braceStart; i < source.length; i += 1) {
		const char = source[i];
		if (char === "{") depth += 1;
		if (char === "}") depth -= 1;
		if (depth === 0) {
			braceEnd = i;
			break;
		}
	}
	if (braceEnd === -1) return null;

	return source.slice(braceStart + 1, braceEnd);
}

function extractReturnMarkup(functionBody) {
	const returnIndex = functionBody.lastIndexOf("return (");
	if (returnIndex === -1) return null;
	const parenStart = functionBody.indexOf("(", returnIndex);
	if (parenStart === -1) return null;

	let depth = 0;
	let parenEnd = -1;
	for (let i = parenStart; i < functionBody.length; i += 1) {
		const char = functionBody[i];
		if (char === "(") depth += 1;
		if (char === ")") depth -= 1;
		if (depth === 0) {
			parenEnd = i;
			break;
		}
	}
	if (parenEnd === -1) return null;

	const script = `${functionBody.slice(0, returnIndex)}${functionBody.slice(parenEnd + 1)}`
		.replace(/^\s+|\s+$/g, "")
		.replace(/;+\s*$/, "")
		.trim();
	const markup = functionBody.slice(parenStart + 1, parenEnd).trim();
	return { script, markup };
}

function transformMarkup(markup) {
	return markup
		.replace(/\bclassName=/g, "class=")
		.replace(/\bhtmlFor=/g, "for=")
		.replace(/\bonClick=/g, "onclick=")
		.replace(/\bonChange=/g, "onchange=")
		.replace(/\bonSubmit=/g, "onsubmit=")
		.replace(/\{\/\*([\s\S]*?)\*\/\}/g, "<!--$1-->")
		.replace(/^\s*<>\s*$/gm, "")
		.replace(/^\s*<\/>\s*$/gm, "")
		.replace(/\{" "\}/g, " ");
}

function convertTsxToSvelte(tsxSource) {
	const blocked = detectUnsupportedTsx(tsxSource);
	if (blocked.length > 0) return { ok: false, blocked };

	let source = tsxSource.replace(/^["']use client["'];?\s*/m, "");
	source = source.replace(/import\s+React(?:,[^;]*)?\s+from\s+["']react["'];?\n?/g, "");
	source = source.replace(/import\s+\*\s+as\s+React\s+from\s+["']react["'];?\n?/g, "");
	source = source.replace(/from\s+["']@\/components\/ui\//g, 'from "$lib/components/ui/');
	source = source.replace(/from\s+["']@\/lib\/utils["']/g, 'from "$lib/utils.js"');
	source = source.replace(/from\s+["']lucide-react["']/g, 'from "@lucide/svelte"');

	const body = extractDefaultFunctionBody(source);
	if (!body) {
		return { ok: false, blocked: ["Unsupported TSX layout: missing default function component."] };
	}
	const parts = extractReturnMarkup(body);
	if (!parts) {
		return { ok: false, blocked: ["Unsupported TSX layout: unable to extract JSX return block."] };
	}

	const scriptLines = parts.script
		.replace(/\bclassName=/g, "class=")
		.replace(/\bhtmlFor=/g, "for=")
		.trim();
	const markup = transformMarkup(parts.markup);

	let result = "";
	if (scriptLines) {
		result += `<script lang="ts">\n${scriptLines}\n</script>\n\n`;
	}
	result += `${markup}\n`;
	return { ok: true, code: result };
}

async function loadInventory(options) {
	if (await exists(options.inventoryPath)) {
		const raw = await fs.readFile(options.inventoryPath, "utf8");
		return JSON.parse(raw);
	}
	const inventory = await buildInventory({ repoRoot: options.repoRoot });
	await fs.mkdir(path.dirname(options.inventoryPath), { recursive: true });
	await fs.writeFile(options.inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
	return inventory;
}

async function writeTextFile(absPath, content) {
	await fs.mkdir(path.dirname(absPath), { recursive: true });
	await fs.writeFile(absPath, content, "utf8");
}

function resolveUpstreamExample(name, upstreamIndex) {
	for (const candidate of buildUpstreamExampleCandidates(name)) {
		const entry = upstreamIndex.examples.get(candidate);
		if (entry) return { type: "exact", entry };
	}

	const normalized = normalizeExampleName(name);
	const candidates = upstreamIndex.normalizedExamples.get(normalized) ?? [];
	if (candidates.length === 1) {
		return {
			type: "normalized",
			entry: upstreamIndex.examples.get(candidates[0]),
		};
	}
	if (candidates.length > 1) {
		return { type: "ambiguous", candidates };
	}
	return null;
}

async function runAudit() {
	const options = parseArgs(process.argv.slice(2));
	const inventory = await loadInventory(options);
	const filteredComponents = inventory.components
		.filter((component) => !options.componentFilter || options.componentFilter.has(component.slug))
		.slice(0, options.maxComponents);

	let upstreamIndex = { docs: new Map(), examples: new Map(), normalizedExamples: new Map() };
	const assumptions = [
		"Ignore local-only docs with no matching upstream Radix doc and mark them as missing.",
		"Use latest upstream main branch as moving parity source.",
		"Apply only deterministic safe repairs unless rewrite-divergent-examples is explicitly enabled.",
	];
	if (options.offline) {
		assumptions.push("Offline mode enabled: upstream network fetch was skipped.");
	} else {
		try {
			upstreamIndex = await fetchGitIndexes();
		} catch (error) {
			options.offline = true;
			assumptions.push(
				`Upstream tree lookup failed; continuing in offline mode: ${error?.message ?? String(error)}`
			);
		}
	}

	const componentResults = [];
	const globalChangedFiles = new Set();
	const consolidatedBlockedParity = [];
	const textCache = new Map();

	for (const component of filteredComponents) {
		const localDocAbs = path.resolve(options.repoRoot, component.docPath);
		const localDoc = await fs.readFile(localDocAbs, "utf8");
		const result = {
			slug: component.slug,
			status: "ok",
			links: {
				localDoc: component.docPath,
				upstreamDoc: null,
				upstreamExamples: [],
			},
			fileChanges: [],
			functionalParityNotes: [],
			visualParityNotes: [],
			blockedParity: [],
			assumptions: [],
		};

		let needsUpdate = false;

		const upstreamDocEntry = upstreamIndex.docs.get(component.upstreamDocSlug);
		if (!upstreamDocEntry || options.offline) {
			result.status = "missing";
			result.assumptions.push("No resolvable upstream Radix doc in current run context.");
		} else {
			result.links.upstreamDoc = `${UPSTREAM_RAW_PREFIX}${upstreamDocEntry.path}`;
			let upstreamDocContent = textCache.get(upstreamDocEntry.rawUrl);
			if (!upstreamDocContent) {
				upstreamDocContent = await fetchText(upstreamDocEntry.rawUrl);
				textCache.set(upstreamDocEntry.rawUrl, upstreamDocContent);
			}

			const docDiff = compareDocParity(localDoc, upstreamDocContent);
			if (docDiff.missingHeadings.length > 0) {
				needsUpdate = true;
				result.functionalParityNotes.push(
					`Missing headings versus upstream: ${docDiff.missingHeadings.join(", ")}`
				);
			}
			if (docDiff.missingPreviewNames.length > 0) {
				needsUpdate = true;
				result.visualParityNotes.push(
					`Missing example previews versus upstream: ${docDiff.missingPreviewNames.join(", ")}`
				);
			}

			let nextDoc = localDoc;
			let docChanged = false;

			if (options.mode === "repair") {
				if (
					docDiff.upstreamDescription &&
					docDiff.localDescription &&
					docDiff.localDescription !== docDiff.upstreamDescription
				) {
					const replacement = replaceDescription(nextDoc, docDiff.upstreamDescription);
					if (replacement.changed) {
						nextDoc = replacement.content;
						docChanged = true;
					}
				}

				if (docDiff.missingPreviewNames.length > 0) {
					const insertResult = insertMissingExampleBlocks(nextDoc, docDiff.missingPreviewNames);
					if (insertResult.changed) {
						nextDoc = insertResult.content;
						docChanged = true;
					}
				}

				if (docChanged) {
					await writeTextFile(localDocAbs, nextDoc);
					result.fileChanges.push(component.docPath);
					globalChangedFiles.add(component.docPath);
				}
			}
		}

		for (const exampleRef of component.exampleRefs.filter((ref) => ref.localType === "example")) {
			const localExampleAbs = path.resolve(options.repoRoot, exampleRef.localPath);
			const mapped = options.offline ? null : resolveUpstreamExample(exampleRef.name, upstreamIndex);
			if (!mapped) {
				result.assumptions.push(`No upstream example mapping resolved for ${exampleRef.name}.`);
				continue;
			}
			if (mapped.type === "ambiguous") {
				const blockedEntry = {
					component: component.slug,
					reason: `Ambiguous upstream example mapping for ${exampleRef.name}: ${mapped.candidates.join(", ")}`,
					missingPrimitive: "n/a",
					proposedApiAddition: "Add explicit mapping override for this example name.",
				};
				result.blockedParity.push(blockedEntry);
				consolidatedBlockedParity.push(blockedEntry);
				continue;
			}

			const upstreamExample = mapped.entry;
			result.links.upstreamExamples.push(upstreamExample.rawUrl);
			let upstreamExampleTsx = textCache.get(upstreamExample.rawUrl);
			if (!upstreamExampleTsx) {
				upstreamExampleTsx = await fetchText(upstreamExample.rawUrl);
				textCache.set(upstreamExample.rawUrl, upstreamExampleTsx);
			}

			if (!exampleRef.localExists) {
				needsUpdate = true;
				result.functionalParityNotes.push(
					`Missing local example: ${exampleRef.name} (mapped to ${upstreamExample.name}).`
				);
				if (options.mode === "repair") {
					const converted = convertTsxToSvelte(upstreamExampleTsx);
					if (!converted.ok) {
						const blockedEntry = {
							component: component.slug,
							reason: `${exampleRef.name}: ${converted.blocked.join(" ")}`,
							missingPrimitive: "Bits UI parity extension (manual review)",
							proposedApiAddition:
								"Expose upstream-equivalent behavior as minimal props/events in relevant wrapper primitives.",
						};
						result.blockedParity.push(blockedEntry);
						consolidatedBlockedParity.push(blockedEntry);
					} else {
						await writeTextFile(localExampleAbs, converted.code);
						result.fileChanges.push(exampleRef.localPath);
						globalChangedFiles.add(exampleRef.localPath);
					}
				}
				continue;
			}

			const localExampleSvelte = await fs.readFile(localExampleAbs, "utf8");
			const parity = compareExampleParity(localExampleSvelte, upstreamExampleTsx);
			if (parity.functional.length > 0) {
				needsUpdate = true;
				result.functionalParityNotes.push(
					`${exampleRef.name}: ${parity.functional.join(" ")}`
				);
			}
			if (parity.visual.length > 0) {
				needsUpdate = true;
				result.visualParityNotes.push(`${exampleRef.name}: ${parity.visual.join(" ")}`);
			}

			if (parity.divergent && options.mode === "repair" && options.rewriteDivergentExamples) {
				const converted = convertTsxToSvelte(upstreamExampleTsx);
				if (!converted.ok) {
					const blockedEntry = {
						component: component.slug,
						reason: `${exampleRef.name}: ${converted.blocked.join(" ")}`,
						missingPrimitive: "Bits UI parity extension (manual review)",
						proposedApiAddition:
							"Expose upstream-equivalent behavior as minimal props/events in relevant wrapper primitives.",
					};
					result.blockedParity.push(blockedEntry);
					consolidatedBlockedParity.push(blockedEntry);
				} else {
					await writeTextFile(localExampleAbs, converted.code);
					result.fileChanges.push(exampleRef.localPath);
					globalChangedFiles.add(exampleRef.localPath);
				}
			}
		}

		if (result.blockedParity.length > 0) {
			result.status = "blocked";
		} else if (result.status === "missing") {
			result.status = "missing";
		} else if (needsUpdate || result.fileChanges.length > 0) {
			result.status = "updated";
		} else {
			result.status = "ok";
		}

		result.links.upstreamExamples = unique(result.links.upstreamExamples);
		componentResults.push(result);
	}

	const summary = { ok: 0, updated: 0, missing: 0, blocked: 0 };
	for (const component of componentResults) {
		if (component.status in summary) summary[component.status] += 1;
	}

	const report = {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		mode: options.mode,
		upstream: {
			repository: "shadcn-ui/ui",
			branch: "main",
			docTree: "apps/v4/content/docs/components/radix",
			exampleTree: "apps/v4/examples/radix",
		},
		summary: {
			totalComponents: componentResults.length,
			...summary,
			changedFileCount: globalChangedFiles.size,
		},
		components: componentResults,
		blockedParity: consolidatedBlockedParity,
		assumptions,
	};

	await fs.mkdir(path.dirname(options.reportPath), { recursive: true });
	await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

	const markdown = renderReportMarkdown(report);
	await fs.mkdir(path.dirname(options.markdownPath), { recursive: true });
	await fs.writeFile(options.markdownPath, markdown, "utf8");

	process.stdout.write(
		`Audit complete: total=${report.summary.totalComponents}, ok=${report.summary.ok}, updated=${report.summary.updated}, missing=${report.summary.missing}, blocked=${report.summary.blocked}\n`
	);
	process.stdout.write(`Wrote ${toPosix(path.relative(options.repoRoot, options.reportPath))}\n`);
	process.stdout.write(`Wrote ${toPosix(path.relative(options.repoRoot, options.markdownPath))}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	runAudit().catch((error) => {
		process.stderr.write(`${error?.stack ?? String(error)}\n`);
		process.exit(1);
	});
}
