import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StartCard({
  label,
  value,
  change,
  computeData,
  storageData,
  energyData,
  depreciationData,
  loading,
  summary,
  // New props for debugging and personalization
  simulationId,
  icon,
  color,
  description,
  isActive,
  debugInfo,
}) {
  const lastDataRef = useRef({
    label,
    value,
    change,
    computeData,
    storageData,
    energyData,
    depreciationData,
  });

  useEffect(() => {
    if (!loading) {
      lastDataRef.current = {
        label,
        value,
        change,
        computeData,
        storageData,
        energyData,
        depreciationData,
      };
    }
  }, [loading, label, value, change, computeData, storageData, energyData, depreciationData]);

  const display = loading ? lastDataRef.current : {
    label,
    value,
    change,
    computeData,
    storageData,
    energyData,
    depreciationData,
  };
  const [animatedValue, setAnimatedValue] = useState(display.value || 0);
  const animRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const from = Number(animatedValue || 0);
    const to = Number(display.value || 0);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
      setAnimatedValue(to);
      return;
    }
    const duration = 700;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setAnimatedValue(next);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [display.value, loading]);

  // Dynamische Top-4 aus summary
  let breakdownFields = [];
  if (summary && typeof summary === "object") {
    const emojiMap = {
      "S3": "🪣",
      "SQL Storage": "🗄️",
      "Athena": "🏛️",
      "ETL Compute": "⚙️",
      "Transfer": "🔄",
      "OP-Fix": "🧾",
      "H-Ware": "🗄️",
      "Energ": "⚡",
      "Support": "🛟",
      "Storage": "💾",
      "Compute": "🧠",
      "Energy": "🔌",
      "Depreciation": "📉",
      "DBU": "🧮",
      "EC2": "🖥️",
      "Egress": "🚪",
      "Total": "💰",
      "Total Size": "📦",
      "Total Download Time": "⏬",
      "Total Duration": "⏱️",
      "Num Queries": "🔢",
      "Duration Sec": "⏳",
      "Result Size Bytes": "📄",
      "Sim Num Queries Total": "🧪",
      "Params": "🧩"
    };
    breakdownFields = Object.entries(summary)
      .filter(([k, v]) => {
        const key = k.trim();
        return (
          typeof v === "number" &&
          isFinite(v) &&
          v !== 0 &&
          !/^total/i.test(key) &&
          (/[€$]/.test(key) || /euro/i.test(key) || /\(eur\)/i.test(key))
        );
      })
      .map(([k, v]) => {
        const key = k.trim();
        let emoji = "";
        for (const [name, icon] of Object.entries(emojiMap)) {
          if (key.toLowerCase().includes(name.toLowerCase())) {
            emoji = icon;
            break;
          }
        }
        return { key: k, label: emoji || k, color: "orange-500", sum: v };
      })
      .sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum))
      .slice(0, 4);
  }

  // Debug logging für jede Karte
  console.log(`🎯 StartCard [${label}] received data:`, {
    simulationId,
    value,
    change,
    summary,
    computeDataLength: computeData?.length,
    storageDataLength: storageData?.length,
    energyDataLength: energyData?.length,
    depreciationDataLength: depreciationData?.length,
    debugInfo,
    isActive
  });

  const formattedValue = new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0,
  }).format(animatedValue || 0);

  const getChartData = (compute, storage, energy, depreciation) => {
    const labels = compute?.map((_, index) => index + 1) || [];
    return {
      labels,
      datasets: [
        {
          label: "Compute",
          data: compute,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Storage",
          data: storage,
          borderColor: "#eab308",
          backgroundColor: "rgba(234, 179, 8, 0.1)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Energy",
          data: energy,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Depreciation",
          data: depreciation,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 1.5,
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuart",
    },
  };

  // Prüfe, ob für irgendein Breakdown-Feld Daten vorhanden sind
  const hasAnyData = breakdownFields.length > 0;
  const shouldShowNoData = !loading && !hasAnyData;

  return (
  <div className="relative bg-card-white w-full h-[260px] rounded-3xl shadow-enterprise-lg border border-gray-100 p-6 flex flex-col text-text-dark overflow-visible hover:shadow-enterprise-xl transition-all duration-300 group">
      {loading && (
        <div className="absolute top-3 right-3 z-20">
          <div className="w-7 h-7 rounded-full bg-white/90 shadow-sm border border-gray-100 flex items-center justify-center animate-spin" style={{ animationDuration: '1.8s' }}>
            <span className="text-sm">⏳</span>
          </div>
        </div>
      )}
      {shouldShowNoData ? (
        <div className="flex flex-col justify-center items-center h-full text-center z-0">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            No data available
          </div>
          <div className="text-xs text-gray-400">Select different period</div>
        </div>
      ) : (
  <div className="h-full flex flex-col transition-opacity duration-300 opacity-100">
          {/* Header */}
          <div className="flex-shrink-0 mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="w-5 h-5 bg-gradient-to-br from-accent-orange to-accent-gold rounded flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white text-xs font-bold">€</span>
                  </div>
                  <div className="text-base font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent truncate">
                    {formattedValue}
                  </div>
                </div>
                    {typeof display.change === "number" && (
                  <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                    display.change >= 0 
                      ? "bg-green-50 text-green-600" 
                      : "bg-red-50 text-red-600"
                  }`}>
                    <span className={`text-xs ${display.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {display.change >= 0 ? "▲" : "▼"}
                    </span>
                    {/*
                    <span className="text-xs">
                      {display.change >= 0
                        ? `+${display.change.toFixed(1)}%`
                        : `${display.change.toFixed(1)}%`}
                    </span>
                    */}
                  </div>
                )}
              </div>
              <div className="text-xs font-medium text-text-light uppercase tracking-wide truncate">{display.label}</div>
            </div>
          </div>

          {/* Dynamischer Breakdown: Nur Felder anzeigen, die Daten haben */}
          <div className="flex-1 space-y-2">
            <div className="space-y-1.5">
              {breakdownFields.map(field => (
                <div key={field.key} className="flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-text-light`}>
                    <div className={`w-1 h-1 bg-${field.color} rounded-full`}></div>
                    <span
                      className="text-xs font-medium cursor-pointer"
                      title={`Variable: ${field.key}\nWert: ${field.sum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    >
                      {field.label}
                    </span>
                  </div>
                  <span className="font-medium text-text-dark text-xs">
                    {field.sum.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
            {/* Chart */}
            <div className="h-16 mt-2">
              <Line
                data={getChartData(
                  display.computeData,
                  display.storageData,
                  display.energyData,
                  display.depreciationData
                )}
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}