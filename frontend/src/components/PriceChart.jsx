import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-amber-400 font-semibold text-sm">🪙 {payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
}

export default function PriceChart({ data = [], onRangeChange }) {
  const [range, setRange] = useState('7d');

  const handleRange = (r) => {
    setRange(r);
    if (onRangeChange) onRangeChange(r === '7d' ? 7 : 30);
  };

  const formatted = data.map(d => ({
    ...d,
    label: (() => {
      try {
        return format(typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date), 'MMM d');
      } catch {
        return d.date;
      }
    })(),
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 bg-slate-800/50 rounded-xl border border-slate-700">
        <p className="text-slate-500 text-sm">No price history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Range toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-slate-300 text-sm font-medium">Price History</h4>
        <div className="flex gap-1">
          {['7d', '30d'].map(r => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `🪙${v.toLocaleString()}`}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
