import React from "react";

export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
      <label htmlFor="timeRange" className="text-xs sm:text-sm font-semibold text-accent-orange">
        Time Range:
      </label>
      <select
        id="timeRange"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded border px-2 py-1 text-xs sm:text-sm bg-white text-text-slate w-full sm:w-auto"
      >
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
      </select>
    </div>
  );
}
