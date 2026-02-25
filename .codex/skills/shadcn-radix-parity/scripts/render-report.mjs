#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		report: null,
		output: null,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--repo-root") {
			options.repoRoot = path.resolve(argv[i + 1]);
			i += 1;
		} else if (arg === "--report") {
			options.report = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		} else if (arg === "--output") {
			options.output = path.resolve(options.repoRoot, argv[i + 1]);
			i += 1;
		}
	}

	options.report ||= path.resolve(options.repoRoot, "parity-report.json");
	options.output ||= path.resolve(options.repoRoot, "parity-report.md");
	return options;
}

function toPosix(p) {
	return p.split(path.sep).join("/");
}

function escapePipe(text) {
	return String(text).replaceAll("|", "\\|");
}

function statusCounts(components) {
	const counts = { ok: 0, updated: 0, missing: 0, blocked: 0 };
	for (const component of components) {
		if (component.status in counts) counts[component.status] += 1;
	}
	return counts;
}

export function renderReportMarkdown(report) {
	const components = report.components ?? [];
	const counts = statusCounts(components);
	const changedFiles = new Set(
		components.flatMap((component) => component.fileChanges ?? []).filter(Boolean)
	);
	const lines = [];

	lines.push("# Shadcn-Svelte Radix Parity Report");
	lines.push("");
	lines.push(`- Generated: ${report.generatedAt ?? "unknown"}`);
	lines.push(`- Mode: ${report.mode ?? "unknown"}`);
	lines.push(`- Upstream branch: ${report.upstream?.branch ?? "main"}`);
	lines.push(`- Components audited: ${components.length}`);
	lines.push(
		`- Status counts: ok=${counts.ok}, updated=${counts.updated}, missing=${counts.missing}, blocked=${counts.blocked}`
	);
	lines.push(`- Changed files: ${changedFiles.size}`);
	lines.push("");
	lines.push("## Component Status");
	lines.push("");
	lines.push("| Component | Status | Upstream Doc | File Changes |");
	lines.push("|---|---|---|---|");

	for (const component of components) {
		const upstreamDoc = component.links?.upstreamDoc
			? `[doc](${component.links.upstreamDoc})`
			: "n/a";
		const fileChangeCount = component.fileChanges?.length ?? 0;
		lines.push(
			`| ${escapePipe(component.slug)} | ${component.status} | ${upstreamDoc} | ${fileChangeCount} |`
		);
	}

	lines.push("");
	lines.push("## Details");
	lines.push("");
	for (const component of components) {
		lines.push(`### ${component.slug} (${component.status})`);
		if (component.links?.localDoc) lines.push(`- Local doc: \`${component.links.localDoc}\``);
		if (component.links?.upstreamDoc) lines.push(`- Upstream doc: ${component.links.upstreamDoc}`);
		if (component.fileChanges?.length) {
			lines.push("- File changes:");
			for (const file of component.fileChanges) lines.push(`  - \`${file}\``);
		}
		if (component.functionalParityNotes?.length) {
			lines.push("- Functional parity notes:");
			for (const note of component.functionalParityNotes) lines.push(`  - ${note}`);
		}
		if (component.visualParityNotes?.length) {
			lines.push("- Visual parity notes:");
			for (const note of component.visualParityNotes) lines.push(`  - ${note}`);
		}
		if (component.blockedParity?.length) {
			lines.push("- Blocked parity:");
			for (const blocked of component.blockedParity) {
				lines.push(
					`  - ${blocked.reason} (missing: ${blocked.missingPrimitive}; proposal: ${blocked.proposedApiAddition})`
				);
			}
		}
		if (component.assumptions?.length) {
			lines.push("- Assumptions:");
			for (const assumption of component.assumptions) lines.push(`  - ${assumption}`);
		}
		lines.push("");
	}

	if (Array.isArray(report.blockedParity) && report.blockedParity.length > 0) {
		lines.push("## Consolidated Blocked Parity");
		lines.push("");
		for (const item of report.blockedParity) {
			lines.push(
				`- ${item.component}: ${item.reason} (missing: ${item.missingPrimitive}; proposal: ${item.proposedApiAddition})`
			);
		}
		lines.push("");
	}

	if (Array.isArray(report.assumptions) && report.assumptions.length > 0) {
		lines.push("## Global Assumptions");
		lines.push("");
		for (const assumption of report.assumptions) lines.push(`- ${assumption}`);
		lines.push("");
	}

	return `${lines.join("\n").trimEnd()}\n`;
}

async function runCli() {
	const options = parseArgs(process.argv.slice(2));
	const reportRaw = await fs.readFile(options.report, "utf8");
	const report = JSON.parse(reportRaw);
	const markdown = renderReportMarkdown(report);

	await fs.mkdir(path.dirname(options.output), { recursive: true });
	await fs.writeFile(options.output, markdown, "utf8");

	process.stdout.write(`Report rendered: ${toPosix(path.relative(options.repoRoot, options.output))}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	runCli().catch((error) => {
		process.stderr.write(`${error?.stack ?? String(error)}\n`);
		process.exit(1);
	});
}

