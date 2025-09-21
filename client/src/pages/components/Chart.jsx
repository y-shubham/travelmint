import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
  CartesianGrid,
} from "recharts";

function currency(n) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `$${Number(n || 0)}`;
  }
}

function shortDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">
        {currency(item.value)}
      </p>
    </div>
  );
};

export default function Chart({ data }) {
  const realData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    // Sort by createdAt and map to a clean shape
    return data
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((item) => ({
        price: Number(item?.totalPrice || 0),
        // label used on the X axis
        dateLabel: shortDate(item?.createdAt),
        // keep raw for uniqueness if needed
        _rawDate: item?.createdAt,
      }));
  }, [data]);

  if (!realData.length) {
    return (
      <div className="w-full m-2 h-60 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm grid place-items-center">
        <p className="text-sm text-neutral-600">No booking data to display.</p>
      </div>
    );
  }

  return (
    <div className="w-full m-2 h-60 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">
        Bookings
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={realData}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.55} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            dataKey="price"
            tickFormatter={(v) => currency(v)}
            width={72}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(2, 6, 23, 0.04)" }}
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="price"
            fill="url(#barFill)"
            radius={[8, 8, 0, 0]}
            isAnimationActive
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
