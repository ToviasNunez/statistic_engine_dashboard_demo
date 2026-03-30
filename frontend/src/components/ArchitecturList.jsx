import {
  ClientSideRowModelModule,
  ModuleRegistry
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ArchitectureList({ selectedArchs, setSelectedArchs }) {
  const architectures = [
    { log: "☁️", name: "AWS", id: "aws" },
    { log: "🏠", name: "OnPremise", id: "onprem" },
    { log: "⚙️", name: "Hybrid", id: "hybrid" },
    { log: "🔷", name: "Databricks", id: "databricks" },
    { log: "🏛️", name: "Lakehouse", id: "lakehouse_onprem" }
  ];

  const toggleSelection = (id) => {
    if (selectedArchs.includes(id)) {
      setSelectedArchs(selectedArchs.filter((arch) => arch !== id));
      console.log(`Deselected architecture: ${id}`);
    } else {
      setSelectedArchs([...selectedArchs, id]);
        console.log(`Selected architecture: ${id}`);
    }
  };

  return (
    <div className="bg-card-white text-text-dark h-full w-full flex flex-col rounded-2xl shadow-enterprise-lg border border-gray-100">
      <div className="p-6 w-full flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-dark">Architecture Types</h3>
        </div>

        <ul className="space-y-3 overflow-y-auto pr-2 flex-1">
          {architectures.map((arch) => (
            <li
              key={arch.id}
              onClick={() => toggleSelection(arch.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                selectedArchs.includes(arch.id)
                  ? "bg-gradient-to-r from-accent-orange/10 to-accent-gold/10 border-accent-orange/30 shadow-md"
                  : "hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                    selectedArchs.includes(arch.id)
                      ? "bg-gradient-to-br from-accent-orange to-accent-gold text-white shadow-md"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {arch.log}
                  </div>
                  <span className="text-sm font-medium text-text-dark">{arch.name}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  selectedArchs.includes(arch.id)
                    ? "bg-accent-orange border-accent-orange"
                    : "border-gray-300"
                }`}>
                  {selectedArchs.includes(arch.id) && (
                    <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
