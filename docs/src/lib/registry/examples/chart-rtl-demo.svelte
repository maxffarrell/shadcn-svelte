<script lang="ts">
	import { scaleBand } from "d3-scale";
	import { BarChart } from "layerchart";
	import * as Chart from "$lib/registry/ui/chart/index.js";

	const chartData = [
		{ month: "January", desktop: 186, mobile: 80 },
		{ month: "February", desktop: 305, mobile: 200 },
		{ month: "March", desktop: 237, mobile: 120 },
		{ month: "April", desktop: 73, mobile: 190 },
		{ month: "May", desktop: 209, mobile: 130 },
		{ month: "June", desktop: 214, mobile: 140 },
	];

	const translations = {
		en: {
			dir: "ltr",
			months: ["January", "February", "March", "April", "May", "June"],
			desktop: "Desktop",
			mobile: "Mobile",
		},
		ar: {
			dir: "rtl",
			months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
			desktop: "سطح المكتب",
			mobile: "الجوال",
		},
		he: {
			dir: "rtl",
			months: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני"],
			desktop: "מחשב",
			mobile: "נייד",
		},
	} as const;

	let language = $state<keyof typeof translations>("ar");
	const translation = $derived(translations[language]);
	const localizedData = $derived(
		chartData.map((row, index) => ({ ...row, month: translation.months[index] }))
	);
	const chartConfig = $derived({
		desktop: { label: translation.desktop, color: "var(--chart-2)" },
		mobile: { label: translation.mobile, color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig);
</script>

<div class="w-full space-y-4">
	<label class="flex items-center justify-end gap-2 text-sm">
		Language
		<select bind:value={language} class="rounded-md border bg-background px-2 py-1">
			<option value="en">English</option>
			<option value="ar">العربية</option>
			<option value="he">עברית</option>
		</select>
	</label>
	<Chart.Container config={chartConfig} dir={translation.dir} class="aspect-auto h-[250px] w-full">
		<BarChart
			data={localizedData}
			xReverse={translation.dir === "rtl"}
			x="month"
			xScale={scaleBand()}
			bandPadding={0.2}
			groupPadding={0.08}
			seriesLayout="group"
			series={[
				{ key: "desktop", label: chartConfig.desktop.label, color: "var(--color-desktop)" },
				{ key: "mobile", label: chartConfig.mobile.label, color: "var(--color-mobile)" },
			]}
			rule={false}
			grid={{ x: false, y: true }}
			axis="x"
			legend
			props={{
				bars: { rounded: "all", radius: 4, stroke: "none", motion: Chart.defaultBarMotion },
				xAxis: { format: (month) => month.slice(0, 3), tickLength: 10, tickMarks: false },
				highlight: { area: { class: "fill-muted" } },
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip />
			{/snippet}
		</BarChart>
	</Chart.Container>
</div>
