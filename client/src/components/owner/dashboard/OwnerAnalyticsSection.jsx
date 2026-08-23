import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';

const CustomRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 text-white p-3 rounded-2xl shadow-xl text-xs font-semibold border border-zinc-800">
        <p className="text-zinc-400 font-bold mb-1">{data.fullDate || label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold text-sm">₹{data.revenue}</span>
          <span className="text-zinc-400">Revenue</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomCustomerTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 text-white p-3 rounded-2xl shadow-xl text-xs font-semibold border border-zinc-800 space-y-1">
        <p className="text-zinc-400 font-bold mb-1">{data.fullDate || label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-zinc-200">Completed:</span>
          <span className="font-bold text-emerald-400">{data.completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-zinc-200">Other / Active:</span>
          <span className="font-bold text-indigo-400">{data.other}</span>
        </div>
        <div className="pt-1 border-t border-zinc-800 flex items-center justify-between text-zinc-400">
          <span>Total Bookings:</span>
          <span className="font-black text-white">{data.customers}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const OwnerAnalyticsSection = ({
  last7DaysData,
  sevenDayRevenueTotal,
  sevenDayCustomerTotal,
  sevenDayOutcomeTotal,
  pieChartData,
  allStatusList,
}) => {
  return (
    <div className="space-y-6">
      {/* ROW 1: Revenue Trend Area Chart */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900">
                Revenue Overview (Last 7 Days)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Daily earnings from completed customer services across the last 7 days
              </p>
            </div>
          </div>

          <div className="hidden sm:block px-3.5 py-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">
              7-Day Total
            </p>
            <p className="text-base sm:text-lg font-black text-emerald-700">
              ₹{sevenDayRevenueTotal.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="h-72 min-w-[540px] sm:min-w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: Bar Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Volume Bar Chart */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900">
                  Total Bookings & Completed
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Daily total bookings with completed portion highlighted
                </p>
              </div>
            </div>

            <div className="hidden sm:block px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/60 rounded-xl text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-800">
                7-Day Total
              </p>
              <p className="text-sm sm:text-base font-black text-indigo-700">
                {sevenDayCustomerTotal} Bookings
              </p>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="h-60 min-w-[480px] sm:min-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomCustomerTooltip />} />
                  <Bar dataKey="completed" name="Completed" stackId="bookings" fill="#10b981" maxBarSize={36} />
                  <Bar
                    dataKey="other"
                    name="Other / Active"
                    stackId="bookings"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 pt-3 border-t border-zinc-100 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-700 font-bold">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-zinc-700 font-bold">Other / Active (Total Bar)</span>
            </div>
          </div>
        </div>

        {/* 7-Day Outcome Breakdown Donut Chart */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900">
                  Outcome Breakdown (Last 7 Days)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Completed, cancelled & no-show outcomes over the week
                </p>
              </div>
            </div>

            <span className="hidden sm:block px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-black shrink-0">
              {sevenDayOutcomeTotal} Outcomes
            </span>
          </div>

          {pieChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="h-52 w-52 relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} Bookings`, name]}
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-zinc-900">{sevenDayOutcomeTotal}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Resolved
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 w-full">
                {allStatusList.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-zinc-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-900">{item.value}</span>
                      <span className="text-[10px] font-bold text-zinc-500 w-8 text-right">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-zinc-500">
              <PieIcon className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-semibold">No resolved appointments in the last 7 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
