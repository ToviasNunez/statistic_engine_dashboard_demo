import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChartCost({ onpremCard, awsCard, hybridCard , databricksCard, lakehouseOnPremCard }) {
  const simulationValues = [
    onpremCard?.value || 0,
    awsCard?.value || 0,
    hybridCard?.value || 0,
    databricksCard?.value || 0,
    lakehouseOnPremCard?.value || 0,
  ];

  const simulationLabels = ["On-Premise", "AWS", "Hybrid Lakehouse", "Databricks", "Lakehouse OnPrem"];

  // Use KWS brand colors directly for each segment
  const backgroundColor = [
    "#D95C12", // Accent Orange for On-Premise
    "#F0B400", // Accent Gold for AWS
    "#82B366", // Accent Green for Hybrid Lakehouse
    "#0072B8", // Accent Blue for Databricks
    "#8B4A8B"  // Purple for Lakehouse OnPrem
  ];

  const data = {
    labels: simulationLabels,
    datasets: [
      {
        label: "Simulation Cost Share",
        data: simulationValues,
        backgroundColor: backgroundColor,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const label = context.label;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: €${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: "top",
        labels: {
          font: {
            size: 10, // Smaller font size
          },
          boxWidth: 10, // Smaller color box
          padding: 5, // Reduce padding between items
        },
      },
    },
  };

  return (
    <div className="bg-card-white text-text-dark rounded-2xl shadow-enterprise-lg border border-gray-100 p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-orange to-accent-gold rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text-dark">
          Cost Simulation Breakdown
        </h2>
      </div>
      <div className="w-full h-[280px] flex justify-center items-center">
        <Pie data={data} options={{...options, responsive: true, maintainAspectRatio: false}} />
      </div>
    </div>
  );
}