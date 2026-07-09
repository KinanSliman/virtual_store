"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, CHART_CHROME } from "@/lib/chart-colors";

const { BLUE, YELLOW } = CHART_COLORS;
const { GRID, MUTED } = CHART_CHROME;

const tooltipStyle = {
  backgroundColor: "#262626",
  border: "1px solid #404040",
  borderRadius: 6,
  fontSize: 12,
  color: "#e5e5e5",
};

const axisTick = { fill: MUTED, fontSize: 12 };

export function RevenueChart({
  data,
}: {
  data: { day: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="day"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#383835" }}
          minTickGap={24}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
          cursor={{ stroke: MUTED, strokeDasharray: "3 3" }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={BLUE}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  color,
  label,
}: {
  data: { name: string; value: number }[];
  color?: string;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 30}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#383835" }}
          width={110}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [value, label]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar
          dataKey="value"
          fill={color ?? BLUE}
          barSize={16}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StockByCategoryChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="name"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#383835" }}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [value, "Units in stock"]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar
          dataKey="value"
          fill={YELLOW}
          barSize={28}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
