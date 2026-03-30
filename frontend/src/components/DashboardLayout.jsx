import ArchitecturList from "./ArchitecturList";
import { GenotypeStatsTable } from "./GenotypeStatsTable";
import { GenotypeBenchmarkTable } from "./GenotypeBenchmarkTable";
import { DatabricksStatsTable } from "./DatabricksStatsTable";
import Header from "./Header";
import LineChart from "./LineChart";
import PieChartCapacity from "./PieChartCapacity";
import PieChartCost from "./PieChartCost";
import BarChartCost from "./BarChartCost";
import StartCard from "./StartCard";
import Calendar from "./Calendar";
import GeoMap from "./GeoMap";
import SimulationEqualizer from "./SimulationEqualizer";
import { useState } from "react";
import TimeRangeSelector from "./TimeRangeSelector";

export default function DashboardLayout({
  benchmark,
  benchmarkRange, // <-- add this prop
  benchmarkRangeLoading,
  stats,
  databricksStats,
  mapRecentEvents,
  mapCurrentEvent,
  mapCurrentValidation,
  mapFeedLoading,
  mapFeedError,
  statsPage,
  setStatsPage,
  benchmarkPage,
  setBenchmarkPage,
  databricksPage,
  setDatabricksPage,
  pageSize,
  goToPage,
  totalPages,
  statsTotalPages,
  benchmarkTotalPages,
  databricksTotalPages,
  onpremCard,
  awsCard,
  hybridCard,
  usage,
  databricksCard,
  lakehouseOnPremCard,
  pulseTrigger,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onpremLoading,
  awsLoading,
  hybridLoading,
  databricksLoading,
  databricksStatsLoading,
  lakehouseOnPremLoading,
  benchmarkLoading,
  mode,
  onModeChange,
  equalizerValues,
  updateEqualizerValue,
}) {
  // Dummy-Implementierung, damit die Komponente funktioniert
  // Equalizer-Logik entfernt – StartCard verwendet nur Backend-Werte
  const [tableType, setTableType] = useState('benchmark'); // 'benchmark' or 'stats'
  // Standardmäßig Hybrid vorausgewählt (kein leerer String!)
  const [selectedArchs, setSelectedArchs] = useState(["hybrid"]); // Allow multiple architectures
  const [barTimeRange, setBarTimeRange] = useState("year");
  
    // 🎯 Dynamic Simulation Configurations - Using REAL simulator data
  const simulationConfigs = [
    {
      id: 'onprem',
      label: 'OnPrem',
      originalData: onpremCard, // REAL data from onprem simulator
      loading: onpremLoading,
      icon: '🏢',
      color: '#6366f1',
      description: 'On-premises infrastructure'
    },
    {
      id: 'aws',
      label: 'AWS',
      originalData: awsCard, // REAL data from AWS simulator
      loading: awsLoading,
      icon: '☁️',
      color: '#f59e0b',
      description: 'Amazon Web Services'
    },
    {
      id: 'hybrid',
      label: 'Hybrid',
      originalData: hybridCard, // REAL data from hybrid simulator
      loading: hybridLoading,
      icon: '🔄',
      color: '#10b981',
      description: 'Hybrid cloud solution'
    },
    {
      id: 'databricks',
      label: 'Databricks',
      originalData: databricksCard, // REAL data from databricks simulator
      loading: databricksLoading,
      icon: '⚡',
      color: '#e97749',
      description: 'Databricks platform'
    },
    {
      id: 'lakehouse_onprem',
      label: 'Lakehouse',
      originalData: lakehouseOnPremCard, // REAL data from lakehouse simulator
      loading: lakehouseOnPremLoading,
      icon: '🏞️',
      color: '#8b5cf6',
      description: 'Lakehouse architecture'
    }
  ];

  // Keine Equalizer-Modifikationen mehr nötig, Backend liefert alle Werte
  const processedSimulations = simulationConfigs.map(config => ({
    ...config,
    isActive: selectedArchs.includes(config.id) || (selectedArchs.length === 0 && config.id === 'hybrid'),
    uniqueId: `${config.id}-${Date.now()}`,
    hasRealSimulatorData: !!config.originalData
  }));

  // cards enthält für jede Architektur die Zeitreihen-Daten für den LineChart
  const cards = {};
  processedSimulations.forEach(sim => {
    if (sim.originalData) {
      cards[sim.id] = sim.originalData;
    }
  });

  // Immer mindestens eine Architektur aktiv (Fallback: Hybrid)
  const effectiveSelectedArchs = selectedArchs && selectedArchs.length > 0 ? selectedArchs : ["hybrid"];
  
    // 🎯 REAL SIMULATOR DATA Debug Logs
  console.log("🏭 REAL SIMULATOR DATA from backend:");
  console.log("  🏢 OnPrem Simulator:", {
    hasData: !!onpremCard,
    value: onpremCard?.value,
    hasCompute: !!onpremCard?.computeData?.length,
    hasStorage: !!onpremCard?.storageData?.length,
    hasEnergy: !!onpremCard?.energyData?.length,
    hasDepreciation: !!onpremCard?.depreciationData?.length,
    summary: onpremCard?.summary,
    fullData: onpremCard
  });
  console.log("  ☁️ AWS Simulator:", {
    hasData: !!awsCard,
    value: awsCard?.value,
    hasCompute: !!awsCard?.computeData?.length,
    hasStorage: !!awsCard?.storageData?.length,
    hasTransfer: !!awsCard?.transferData?.length,
    summary: awsCard?.summary,
    fullData: awsCard
  });
  console.log("  🔄 Hybrid Simulator:", {
    hasData: !!hybridCard,
    value: hybridCard?.value,
    summary: hybridCard?.summary,
    fullData: hybridCard
  });
  console.log("  ⚡ Databricks Simulator:", {
    hasData: !!databricksCard,
    value: databricksCard?.value,
    hasCompute: !!databricksCard?.computeData?.length,
    hasStorage: !!databricksCard?.storageData?.length,
    hasEgress: !!databricksCard?.egressData?.length,
    summary: databricksCard?.summary,
    fullData: databricksCard
  });
  console.log("  🏞️ Lakehouse Simulator:", {
    hasData: !!lakehouseOnPremCard,
    value: lakehouseOnPremCard?.value,
    summary: lakehouseOnPremCard?.summary,
    fullData: lakehouseOnPremCard
  });
  
  console.log("🎛️ Processed Simulations with REAL data:", processedSimulations);
  // Equalizer-Logik entfernt
  console.log("🏗️ Selected Architectures:", effectiveSelectedArchs);
  
  // Debug REAL vs MODIFIED data for each simulator
  // Equalizer-Logik entfernt
  return (
    <div className="min-h-screen bg-background-beige text-text-slate font-sans overflow-x-hidden">
      <div className="w-full mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        <Header
          pulseTrigger={pulseTrigger}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          mode={mode}
          onModeChange={onModeChange}
          //loading={databricksLoading}
        />

        {/* KPI Cards - Professional Layout with Equal Spacing */}
        <div className="bg-white rounded-3xl shadow-enterprise-lg p-6 border border-gray-100">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <span className="w-2 h-2 bg-gradient-to-r from-accent-orange to-accent-gold rounded-full"></span>
              Architecture Cost Overview
            </h2>
            <p className="text-sm text-text-light mt-1">Real-time cost comparison across all platforms</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 auto-rows-fr">
            {/* StartCards – nur Backend-gesteuert */}
            {processedSimulations.map((simulation) => {
              const data = simulation.modifiedData || {};
              const orig = simulation.originalData || {};
              // Debug: Zeige die Originaldaten für jede Simulation
              console.log(`🔎 [${simulation.label}] orig:`, orig);

              // Robust extraction of display value (Total) from several possible shapes
              const valueFromCards = Array.isArray(orig.cards)
                ? (orig.cards.find(c => /total/i.test(String(c.name))) || {}).value
                : undefined;
              const summaryTotal = orig?.summary && (orig.summary["Total (EUR)"] || orig.summary["Total (EUR)"] || orig.summary["Total (EUR)"] || orig.summary["Total (EUR)"]);
              const displayValue = (typeof orig.value !== 'undefined' ? orig.value : (summaryTotal ?? valueFromCards ?? 0));

              // Flexible time-series extraction: try multiple key names used by different simulators
              const computeData = orig.computeData ?? orig.daily_compute_costs ?? orig.daily_athena_costs ?? orig.dailyComputeCosts ?? [];
              const storageData = orig.storageData ?? orig.daily_storage_costs ?? orig.dailyStorageCosts ?? [];
              const egressData = orig.egressData ?? orig.daily_egress_costs ?? orig.daily_egress_costs ?? orig.daily_egress ?? [];
              const transferData = orig.transferData ?? orig.daily_transfer_costs ?? orig.daily_transfer_costs ?? [];

              // energyData prefers explicit energyData, then egress/transfer fallbacks
              const energyData = orig.energyData ?? transferData ?? egressData ?? [];

              const depreciationData = orig.depreciationData ?? orig.depreciation_data ?? [];

              const changeValue = typeof orig.change === 'number' ? orig.change : (orig.change ?? 0);

              return (
                <div 
                  key={simulation.id}
                  className={`relative transition-all duration-300 ${
                    simulation.isActive ? 'opacity-100 scale-100' : 'opacity-75 scale-95'
                  }`}
                >
                  <StartCard
                    // Core simulation data - use normalized extracted fields
                    label={simulation.label}
                    value={displayValue}
                    change={changeValue}
                    computeData={computeData}
                    storageData={storageData}
                    // Map simulator-specific fields to standardized names
                    energyData={energyData}
                    depreciationData={depreciationData}
                    loading={simulation.loading}
                    summary={orig.summary}
                    // Unique simulation identity and characteristics
                    simulationId={simulation.id}
                    simulationType={simulation.id} // Use ID as type fallback
                    icon={simulation.icon}
                    color={simulation.color}
                    description={simulation.description}
                    isActive={simulation.isActive}
                    // Debug information for troubleshooting
                    debugInfo={{
                      hasOriginalData: !!simulation.originalData,
                      simulationId: simulation.id
                    }}
                    originalDataAvailable={!!simulation.originalData}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Equalizer direkt unter den StartCards (Accordion) */}
        <details className="w-full max-w-full mx-auto mt-6 mb-8 group">
          <summary className="list-none cursor-pointer select-none bg-white rounded-2xl shadow-enterprise-lg border border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-gradient-to-r from-accent-orange to-accent-gold rounded-full"></span>
              <span className="font-semibold text-text-dark">Simulation Equalizer</span>
            </div>
            <span className="text-text-light text-sm group-open:hidden">Open</span>
            <span className="text-text-light text-sm hidden group-open:inline">Close</span>
          </summary>
          <div className="mt-4">
            <SimulationEqualizer
              equalizerValues={equalizerValues}
              updateEqualizerValue={updateEqualizerValue}
            />
          </div>
        </details>

        {/* Equalizer-UI wird separat in Dashboard.jsx verwaltet */}

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 auto-rows-fr">
          {/* Selector List */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full w-full order-2 lg:order-1">
            <ArchitecturList
              selectedArchs={selectedArchs}
              setSelectedArchs={setSelectedArchs}
            />
            <div className="bg-card-white text-text-dark rounded-2xl shadow-enterprise-lg border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-orange to-accent-gold rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-text-dark">Date Range</h4>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Calendar
                  startDate={startDate}
                  endDate={endDate}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                />
              </div>
            </div>
          </div>

          {/* LineChart */}
          <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8 h-full order-1 lg:order-2">
            {/* Debug: Welche Architekturen und Karten werden an LineChart übergeben? */}
            {console.log("LineChart: selectedArchs=", effectiveSelectedArchs, "cards=", cards)}
            <LineChart
              cards={cards}
              stats={stats}
              dates={[startDate, endDate]}
              startDate={startDate}
              endDate={endDate}
              loading={processedSimulations.some(sim => sim.loading)}
              selectedArchs={effectiveSelectedArchs}
              currentMode={mode}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full auto-rows-fr">
              <PieChartCapacity usage={usage} />
              <PieChartCost
                // Cards direkt aus Simulationen extrahieren
                onpremCard={simulationConfigs.find(s => s.id === 'onprem')?.originalData}
                awsCard={simulationConfigs.find(s => s.id === 'aws')?.originalData}
                hybridCard={simulationConfigs.find(s => s.id === 'hybrid')?.originalData}
                databricksCard={simulationConfigs.find(s => s.id === 'databricks')?.originalData}
                lakehouseOnPremCard={simulationConfigs.find(s => s.id === 'lakehouse_onprem')?.originalData}
                // 🎯 Pass dynamic simulation data für advanced rendering
                processedSimulations={processedSimulations}
              />
            </div>
          </div>
        </div>

        {/* Bar Graph with Time Range Selector */}
        <div className="mb-4">
          <TimeRangeSelector value={barTimeRange} onChange={setBarTimeRange} />
          {/* Debug log for benchmarkRange */}
          {console.log('DashboardLayout benchmarkRange:', benchmarkRange)}
          {console.log('BarChartCost benchmarkData:', benchmarkRange?.items || [])}
          <BarChartCost
            benchmarkData={benchmarkRange?.items || []}
            dateRange={[startDate, endDate]}
            timeRange={barTimeRange}
            mode={mode}
            loading={benchmarkRangeLoading}
          />
        </div>

        {/* Global Genetic Data Map */}
        <div className="mb-8">
          <GeoMap
            currentEvent={mapCurrentEvent}
            currentValidation={mapCurrentValidation}
            recentEvents={mapRecentEvents}
            isLiveMode={true}
            loading={mapFeedLoading}
            error={mapFeedError}
          />
        </div>
        
        

        {/* Modern Table Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-50 p-1 rounded-2xl shadow-inner border border-gray-200">
            <div className="flex space-x-1">
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 ${
                  tableType === 'benchmark' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 shadow-sm'
                }`}
                onClick={() => setTableType('benchmark')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Benchmark Analytics
              </button>
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 ${
                  tableType === 'stats' 
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25' 
                    : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 shadow-sm'
                }`}
                onClick={() => setTableType('stats')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Genotype Data
              </button>
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 ${
                  tableType === 'databricks' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 shadow-sm'
                }`}
                onClick={() => setTableType('databricks')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.79 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.79 4 8 4s8-1.79 8-4M4 7c0-2.21 3.79-4 8-4s8 1.79 8 4" />
                </svg>
                Databricks Hub
              </button>
            </div>
          </div>
        </div>
        {tableType === 'stats' ? (
          <GenotypeStatsTable 
            stats={stats} 
            loading={onpremLoading || awsLoading || hybridLoading || databricksLoading} 
            currentPage={statsPage} 
            setCurrentPage={setStatsPage} 
            pageSize={pageSize} 
            goToPage={goToPage}
            totalPages={statsTotalPages || totalPages}
          />
        ) : tableType === 'benchmark' ? (
          <GenotypeBenchmarkTable 
            benchmark={benchmark} 
            loading={benchmarkLoading}
            currentPage={benchmarkPage}
            setCurrentPage={setBenchmarkPage}
            pageSize={pageSize}
            goToPage={goToPage}   
            totalPages={benchmarkTotalPages || totalPages} 
          />
        ) : (
          <DatabricksStatsTable 
            stats={databricksStats} 
            loading={databricksStatsLoading}
            currentPage={databricksPage}
            setCurrentPage={setDatabricksPage}
            pageSize={pageSize}
            goToPage={goToPage}   
            totalPages={databricksTotalPages || totalPages}
            n_Data={databricksStats?.length || 50}
          />
        )}
        
      </div>
    </div>
  );
}
