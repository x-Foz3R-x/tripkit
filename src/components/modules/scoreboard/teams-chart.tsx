"use client";

import { Bar, BarChart, CartesianGrid, XAxis, LabelList, YAxis } from "recharts";
import { ChartContainer } from "~/components/ui/chart";

import type { ChartConfig } from "~/components/ui/chart";
import type { Database } from "~/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface TeamsChartProps {
  teams: Team[];
}

export function TeamsChart({ teams }: TeamsChartProps) {
  const chartData = teams.map((team) => ({
    name: team.name,
    score: team.score ?? 0,
    fill: team.color_hex ?? "hsl(var(--theme-primary))",
  }));

  const chartConfig = {
    score: {
      label: "Punkty",
      color: "hsl(var(--theme-primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="bg-theme-card border-theme-border rounded-2xl border p-4 shadow-xs">
      <ChartContainer config={chartConfig} className="min-h-62.5 w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 20, right: 0, left: -40, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.1} />

          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={12}
            axisLine={false}
            className="font-body text-sm font-bold"
          />

          <YAxis tickLine={true} axisLine={true} tick={true} />

          <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={60}>
            <LabelList
              dataKey="score"
              position="top"
              offset={10}
              className="fill-theme-text font-mono text-sm font-bold"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
