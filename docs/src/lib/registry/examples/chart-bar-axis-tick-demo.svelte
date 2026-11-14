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

	const chartConfig = {
		desktop: {
			label: "Desktop",
			color: "#2563eb",
		},
		mobile: {
			label: "Mobile",
			color: "#60a5fa",
		},
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig} class="aspect-auto h-[200px] w-full">
	<BarChart
		data={chartData}
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
		tooltipContext={false}
		props={{
			bars: { rounded: "all", radius: 4, stroke: "none", motion: Chart.defaultBarMotion },
			xAxis: { format: (month) => month.slice(0, 3), tickLength: 10, tickMarks: false },
		}}
	/>
</Chart.Container>
