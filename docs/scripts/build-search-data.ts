import fs from "node:fs";
import path from "node:path";
import { globby } from "globby";
import removeMd from "remove-markdown";

const CONTENT_DIR = path.resolve(import.meta.dirname, "../content");
const OUTPUT_PATH = path.resolve(
	import.meta.dirname,
	"../src/routes/api/search.json/search.json"
);

type SearchEntry = {
	title: string;
	description: string;
	content: string;
	href: string;
	category: string;
};

function parseFrontmatter(raw: string): { title: string; description: string; body: string } {
	const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { title: "", description: "", body: raw };

	const frontmatter = match[1];
	const body = match[2];

	const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? "";
	const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";

	return { title, description, body };
}

function cleanContent(raw: string): string {
	// Remove <script> blocks
	let content = raw.replace(/<script[\s\S]*?<\/script>/gi, "");
	// Remove HTML/Svelte tags
	content = content.replace(/<[^>]+>/g, " ");
	// Run remove-markdown
	content = removeMd(content, {
		replaceLinksWithURL: true,
		gfm: true,
		useImgAltText: true,
	});
	// Remove code blocks
	content = content.replace(/```[\s\S]*?```/g, "");
	content = content.replace(/`[^`]+`/g, "");
	// Clean up whitespace
	content = content.replace(/\s+/g, " ").trim();
	// Remove remaining markdown syntax
	content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
	content = content.replace(/#{1,6}\s*/g, "");
	content = content.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");

	return content;
}

function deriveHref(filePath: string): string {
	let rel = path.relative(CONTENT_DIR, filePath);
	// Remove .md extension
	rel = rel.replace(/\.md$/, "");
	// Remove /index suffix
	rel = rel.replace(/\/index$/, "");
	// index.md at root → /docs
	if (rel === "index") return "/docs";
	return `/docs/${rel}`;
}

function deriveCategory(filePath: string): string {
	const rel = path.relative(CONTENT_DIR, filePath);
	const firstSegment = rel.split("/")[0];

	if (!firstSegment) return "Getting Started";

	const categories: Record<string, string> = {
		components: "Components",
		installation: "Installation",
		migration: "Migration",
		"dark-mode": "Dark Mode",
		registry: "Registry",
		changelog: "Changelog",
	};

	// Files directly in content/ root (index.md, cli.md, theming.md, etc.)
	if (!rel.includes("/") || firstSegment.endsWith(".md")) {
		return "Getting Started";
	}

	return categories[firstSegment] ?? "Getting Started";
}

async function main() {
	const files = await globby("**/*.md", { cwd: CONTENT_DIR, absolute: true });

	const entries: SearchEntry[] = [];

	for (const file of files) {
		const raw = fs.readFileSync(file, "utf-8");
		const { title, description, body } = parseFrontmatter(raw);

		if (!title) continue;

		entries.push({
			title,
			description,
			content: cleanContent(body),
			href: deriveHref(file),
			category: deriveCategory(file),
		});
	}

	// Ensure output directory exists
	const outputDir = path.dirname(OUTPUT_PATH);
	fs.mkdirSync(outputDir, { recursive: true });

	fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2));
	console.log(`Built search index with ${entries.length} entries → ${OUTPUT_PATH}`);
}

main();
