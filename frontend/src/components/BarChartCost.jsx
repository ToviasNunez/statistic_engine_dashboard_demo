import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

import { useEffect, useRef, useState } from "react";

export default function BarChartCost({
  benchmarkData = [], // Array or object with items
  dateRange = null,   // [startDate, endDate] as strings or Date objects
  timeRange = "year",
  mode = "real",      // "real" or "prediction"
  loading = false,
}) {

  // Normalize mode to match DB values ("real" or "prediction")
  const modeLower = (mode || "real").toLowerCase();
  const normalizedMode = (modeLower === "prediction" || modeLower === "predicted") ? "prediction" : "real";
  const allowedSourceTypes = normalizedMode === "prediction"
    ? new Set(["prediction", "predicted"])
    : new Set(["real"]);
  // Filter records by source_type
  const records = (Array.isArray(benchmarkData) ? benchmarkData : []).filter(
    (row) => {
      const src = (row.source_type || row.sourceType || '').toString().toLowerCase();
      return allowedSourceTypes.has(src);
    }
  );

  // Group by architecture and sum total_cost
  const costByArch = {};
  records.forEach((row) => {
    const rawArch = row.architecture || "Unknown";
    const arch = rawArch.toLowerCase() === "hybrid_lakehouse" ? "Hybrid_Datalake" : rawArch;
    const cost = Number(row.total_cost) || 0;
    if (!costByArch[arch]) costByArch[arch] = 0;
    costByArch[arch] += cost;
  });

  const allArchs = Object.keys(costByArch).sort();
  const [hiddenArchs, setHiddenArchs] = useState([]);

  // Filter out hidden architectures
  const visibleArchs = allArchs.filter((arch) => !hiddenArchs.includes(arch));
  const simulationLabels = visibleArchs;
  const simulationValues = simulationLabels.map((arch) => costByArch[arch]);

  // Debug log
  console.log('BarChartCost:', { simulationLabels, simulationValues, records, hiddenArchs });

  const [showUpdateSpinner, setShowUpdateSpinner] = useState(false);
  const prevSigRef = useRef('');

  useEffect(() => {
    const roundedValues = simulationValues.map(v => Number(Number(v || 0).toFixed(4)));
    const signature = JSON.stringify({ simulationLabels, roundedValues });
    const changed = prevSigRef.current && signature !== prevSigRef.current;
    prevSigRef.current = signature;
    if (changed) {
      setShowUpdateSpinner(true);
      const t = setTimeout(() => setShowUpdateSpinner(false), 900);
      return () => clearTimeout(t);
    }
  }, [simulationLabels, simulationValues]);

  const loadingBadge = (loading || showUpdateSpinner) ? (
    <div className="absolute top-3 right-3 z-20">
      <div
        className="w-7 h-7 rounded-full bg-white/90 shadow-sm border border-gray-100 flex items-center justify-center animate-spin"
        style={{ animationDuration: '1.8s' }}
      >
        <span className="text-sm">⏳</span>
      </div>
    </div>
  ) : null;
  const backgroundColor = [
    "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)", // On-Premise - Orange to Red
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // AWS - Yellow to Orange
    "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Hybrid Lakehouse - Green
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", // Databricks - Blue
    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", // Lakehouse OnPrem - Purple
    "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", // fallback - Gray
  ];

  // Modern solid colors as fallback for Chart.js compatibility
  const solidColors = [
    "#ea580c", // On-Premise
    "#f59e0b", // AWS
    "#10b981", // Hybrid Lakehouse
    "#3b82f6", // Databricks
    "#8b5cf6", // Lakehouse OnPrem
    "#6b7280", // fallback
  ];

  const data = {
    labels: simulationLabels,
    datasets: [
      {
        label: `Cost Analysis`,
        data: simulationValues,
        backgroundColor: solidColors.slice(0, simulationLabels.length),
        borderWidth: 0,
        borderRadius: 8,
        hoverBackgroundColor: solidColors.slice(0, simulationLabels.length).map(color => color + 'CC'),
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            const value = context.raw;
            return `Cost: €${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
          callback: function(value) {
            if (value >= 1000000) {
              return '€' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '€' + (value / 1000).toFixed(1) + 'K';
            }
            return '€' + value;
          },
        },
        title: {
          display: true,
          text: 'Cost (€)',
          color: '#475569',
          font: {
            size: 13,
            weight: '600',
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Format date range elegantly - show only if available
  let dateRangeDisplay = null;
  if (dateRange && dateRange[0] && dateRange[1]) {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('de-DE', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    };
    dateRangeDisplay = (
      <span className="text-sm text-gray-500 font-normal ml-2">
        {formatDate(dateRange[0])} - {formatDate(dateRange[1])}
      </span>
    );
  }

  if (!records.length) {
    return (
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-gray-700 w-full">
        {loadingBadge}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700">
            Cost Comparison by Architecture
            {dateRangeDisplay}
          </h4>
        </div>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          No data available for the selected range.
        </div>
      </div>
    );
  }

  // If all are hidden, show a message
  if (visibleArchs.length === 0) {
    return (
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-gray-700 w-full">
        {loadingBadge}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700">
            Cost Comparison by Architecture
            {dateRangeDisplay}
          </h4>
        </div>
        <div className="text-center text-gray-500 py-6">
          <p className="mb-4">All architectures are hidden. Click a name below to show.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allArchs.map((arch) => (
              <button
                key={arch}
                onClick={() => setHiddenArchs((prev) => prev.filter((a) => a !== arch))}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors duration-200 line-through font-medium"
              >
                {arch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 text-gray-800 w-full hover:shadow-3xl transition-shadow duration-300">
      {loadingBadge}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xl font-bold text-gray-800 leading-tight">
            Cost Comparison by Architecture
          </h4>
          {dateRangeDisplay && (
            <div className="text-sm text-gray-500 mt-1">
              {dateRangeDisplay}
            </div>
          )}
        </div>
      </div>
      <div className="h-[250px] sm:h-[300px]">
        <Bar data={data} options={{...options, responsive: true, maintainAspectRatio: false}} key={simulationLabels.join('-')} />
      </div>
      {/* Interactive legend below chart */}
      <div className="flex flex-wrap gap-2 justify-center mt-6 pt-4 border-t border-gray-100">
        {allArchs.map((arch, index) => {
          const isHidden = hiddenArchs.includes(arch);
          const archColor = solidColors[index] || '#6b7280';
          return (
            <button
              key={arch}
              onClick={() =>
                setHiddenArchs((prev) =>
                  isHidden ? prev.filter((a) => a !== arch) : [...prev, arch]
                )
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm ${
                isHidden
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200 line-through"
                  : "bg-white text-gray-700 hover:scale-105 shadow-md border border-gray-200"
              }`}
              title={isHidden ? "Click to show" : "Click to hide"}
            >
              <div 
                className={`w-3 h-3 rounded-full ${
                  isHidden ? 'bg-gray-400' : ''
                }`}
                style={!isHidden ? { backgroundColor: archColor } : {}}
              />
              {arch}
            </button>
          );
        })}
      </div>
    </div>
  );
}
