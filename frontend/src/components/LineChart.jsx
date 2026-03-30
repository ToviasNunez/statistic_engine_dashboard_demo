import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function LineChart({
  cards,
  stats,
  dates,
  startDate,
  endDate,
  loading,
  selectedArchs,
}) {
  // Dynamisch: Sammle alle numerischen Array-Keys aus allen Simulationen
  // Für jede Architektur: Zeige immer mindestens einen Graphen (Priorität: computeData > storageData > s3Data > egressData > energyData)
  let allValueKeys = new Set();
  const preferredKeys = ["computeData", "storageData", "s3Data", "egressData", "energyData", "transferData", "sqlData", "lambdaData", "athenaData", "depreciationData"];
  selectedArchs.forEach(arch => {
    const card = cards[arch];
    if (card) {
      // Füge bevorzugte Keys zuerst hinzu, falls vorhanden
      let found = false;
      for (const key of preferredKeys) {
        if (Array.isArray(card[key]) && card[key].length > 0 && card[key].every(v => typeof v === 'number' && isFinite(v))) {
          allValueKeys.add(key);
          found = true;
          break;
        }
      }
      // Füge alle weiteren numerischen Arrays hinzu
      Object.keys(card).forEach(key => {
        if (
          Array.isArray(card[key]) &&
          card[key].length > 0 &&
          card[key].every(v => typeof v === 'number' && isFinite(v))
        ) {
          allValueKeys.add(key);
        }
      });
    }
  });
  // Für Hybrid/Lakehouse: auch OnPrem-Keys einbeziehen
  if (selectedArchs.includes('hybrid') || selectedArchs.includes('lakehouse_onprem')) {
    if (cards['onprem']) {
      let found = false;
      for (const key of preferredKeys) {
        if (Array.isArray(cards['onprem'][key]) && cards['onprem'][key].length > 0 && cards['onprem'][key].every(v => typeof v === 'number' && isFinite(v))) {
          allValueKeys.add(key);
          found = true;
          break;
        }
      }
      Object.keys(cards['onprem']).forEach(key => {
        if (
          Array.isArray(cards['onprem'][key]) &&
          cards['onprem'][key].length > 0 &&
          cards['onprem'][key].every(v => typeof v === 'number' && isFinite(v))
        ) {
          allValueKeys.add(key);
        }
      });
    }
  }
  // Label-Map für Anzeige
  const labelMap = {};
  allValueKeys.forEach(key => {
    let label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    labelMap[key] = label;
  });

  const architectureColors = {
    aws: ["#FF5733", "#FF8D1A", "#FFC300", "#DAF7A6", "#C70039"],
    onprem: ["#581845", "#900C3F", "#FF5733", "#FFC300", "#DAF7A6"],
    hybrid: ["#1A5276", "#2E86C1", "#5DADE2", "#AED6F1", "#D6EAF8"],
    databricks: ["#117A65", "#148F77", "#1ABC9C", "#48C9B0", "#76D7C4"],
    lakehouse_onprem: ["#8B4A8B", "#A569BD", "#D2B4DE", "#E8DAEF", "#F4ECF7"],
  };


  // Helper: get aggregation level
  function getAggregationLevel(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 31) return "day";
    if (diffDays <= 365) return "month";
    return "year";
  }

  // Helper: aggregate data by period
  function aggregateDataByPeriod(dates, values, period) {
    const result = {};
    dates.forEach((date, idx) => {
      const d = new Date(date);
      let key;
      if (period === "day") {
        key = d.toLocaleDateString("sv-SE");
      } else if (period === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "year") {
        key = `${d.getFullYear()}`;
      }
      if (!result[key]) result[key] = [];
      result[key].push(values[idx]);
    });
    // Sum for each period
    return {
      labels: Object.keys(result),
      data: Object.values(result).map(arr => arr.reduce((a, b) => a + b, 0)),
    };
  }

  const aggregation = getAggregationLevel(startDate, endDate);

  // Use the first selected arch for labels (all should match)
  let chartLabels = [];
  if (selectedArchs.length > 0 && cards[selectedArchs[0]]?.dates) {
    const { labels } = aggregateDataByPeriod(cards[selectedArchs[0]].dates, cards[selectedArchs[0]].dates.map(() => 1), aggregation);
    chartLabels = labels;
  }

  const generatedDatasets = selectedArchs.flatMap((arch, archIndex) =>
    Array.from(allValueKeys).map((key, index) => {
      // Hybrid/Lakehouse: Zeige OnPrem-Werte, falls im Hybrid nicht vorhanden
      let values = cards[arch]?.[key];
      let rawDates = cards[arch]?.dates;
      if ((!values || values.length === 0) && (arch === 'hybrid' || arch === 'lakehouse_onprem')) {
        values = cards['onprem']?.[key] || [];
        rawDates = cards['onprem']?.dates || [];
      }
      if (!values || !rawDates) return null;
      const { labels, data } = aggregateDataByPeriod(rawDates, values, aggregation);
      // Align data to chartLabels (fill 0 if missing)
      const alignedData = chartLabels.map(lab => {
        const idx = labels.indexOf(lab);
        return idx !== -1 ? data[idx] : 0;
      });
      const colorPalette = architectureColors[arch] || ["#000000"];
      const color = colorPalette[index % colorPalette.length];
      return {
        label: `${arch.toUpperCase()} - ${labelMap[key]}`,
        data: alignedData,
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.4,
        fill: true,
      };
    }).filter(Boolean)
  );

  console.log("Generated datasets:", generatedDatasets);

  // Preserve previous data to prevent layout jump
  const prevDataRef = useRef({ datasets: [], labels: [] });
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!loading && generatedDatasets.length > 0) {
      prevDataRef.current = {
        datasets: generatedDatasets,
        labels: chartLabels,
      };
      setFade(true);
      const timeout = setTimeout(() => setFade(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [loading, JSON.stringify(generatedDatasets)]);

  const { datasets, labels } = loading
    ? prevDataRef.current
    : { datasets: generatedDatasets, labels: chartLabels };

  if (!loading && datasets.length === 0) {
    return (
      <div className="relative bg-card-softGold rounded-2xl shadow-lg p-4 sm:p-6 w-full h-full flex flex-col">
        <h2 className="text-text-mutedBrown font-semibold text-sm sm:text-base">No data available to display.</h2>
      </div>
    );
  }

  return (
    <div className="relative bg-card-white rounded-2xl shadow-enterprise-lg border border-gray-100 p-6 w-full h-[520px] overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text-dark">
          Simulation Comparison Overview
        </h2>
      </div>

      {/* Chart with fade animation */}
      <div
        className={`transition-opacity duration-300 ${
          fade ? "opacity-50" : "opacity-100"
        } h-full`}
      >
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 800,
              easing: "easeOutQuart",
            },
            animations: {
              y: {
                duration: 800,
                easing: "easeOutQuart",
              },
              x: {
                duration: 0,
              },
            },
            layout: {
              padding: {
                top: 20,
                bottom: 20, // ✅ espacio entre fechas y borde inferior
                left: 20,
                right: 20,
              },
            },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: { size: 10 },
                  boxWidth: 10,
                  padding: 5,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 30,
                  padding: 10, // ✅ separación entre fecha y eje
                  font: { size: 10 },
                },
                grid: {
                  offset: true, // ✅ alinea correctamente con los bordes
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  padding: 5,
                },
              },
            },
          }}

        />
      </div>
    </div>
  );
}