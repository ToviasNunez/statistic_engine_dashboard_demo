import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChartCapacity({ usage }) {
   console.log("🔄 PieChart props:", { usage });

  if (!usage) return <div className="text-sm p-4">📊 Loading database usage...</div>;

  const free = usage.total_gb - usage.used_gb;

  const dbCapacityData = {
    labels: ["Used", "Free"],
    datasets: [
      {
        label: "DB Storage (GB)",
        data: [usage.used_gb, free],
        backgroundColor: [
          "#D95C12", // KWS Accent Orange for Used
          "#F0B400"  // KWS Accent Gold for Free
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-card-white text-text-dark rounded-2xl shadow-enterprise-lg border border-gray-100 p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-orange to-accent-gold rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        <h4 className="text-lg font-bold text-text-dark">Database Capacity</h4>
      </div>
      <div className="w-full h-[280px] flex justify-center items-center">
        <Pie data={dbCapacityData} options={{responsive: true, maintainAspectRatio: false}} />
      </div>
      <p className="text-sm text-center mt-3 text-text-light font-medium">
        {usage.used_percent}% used • {usage.total_gb} GB total
      </p>
    </div>
  );
}
