import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { stroke: '#94a3b8', fontSize: 11 };
const GRID = '#e2e8f0';

export function TrendLine({
  data,
  dataKey = 'value',
  color = '#0d9488',
  yDomain,
  height = 240,
  unit = '',
}: {
  data: { label: string; value: number }[];
  dataKey?: string;
  color?: string;
  yDomain?: [number, number];
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={yDomain ?? ['auto', 'auto']} width={44} unit={unit} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({
  data,
  series,
  height = 260,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  height = 240,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-ink-900">{total}</span>
        <span className="text-xs text-ink-400">Open</span>
      </div>
    </div>
  );
}

export function HBar({
  data,
  color = '#0d9488',
  height = 240,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={110} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({
  data,
  color = '#0d9488',
  height = 240,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, color = '#0d9488', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const d = data.map((value, i) => ({ label: String(i), value }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={d} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.75} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
