import { useCallback, useEffect, useState , useRef } from "react";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import { API_BASE_URL } from "../config/api";
import useAWSSimulation from "../hooks/useAWSSimulation";
import useDatabricksSimulation from "../hooks/useDatabricksSimulation";
import { useGenotypeStats } from "../hooks/useGenotypeStats";
import { useGenotypeBenchmark } from "../hooks/useGenotypeBenchmark";
import { useDatabricksStats } from "../hooks/useDatabricksStats";
import useHybridSimulation from "../hooks/useHybridSimulation";
import useOnPremSimulation from "../hooks/useOnPremSimulation";
import useLakehouseOnPremSimulation from "../hooks/useLakehouseOnPremSimulation";
import usePieChartCapacity from "../hooks/usePieChartCapacity";
import { useGenotypeBenchmarkRange } from "../hooks/useGenotypeBenchmarkRange";
import { useGeoMapFeed } from "../hooks/useGeoMapFeed";

// Use centralized API configuration
const socket = io(API_BASE_URL);

export default function Dashboard() {
  // Obtener valores globales del Equalizer
    // Si necesitas estado local del Equalizer, defínelo aquí o pásalo como prop
    // Estado local para equalizerValues (ajusta el valor inicial según tus necesidades)
  const [equalizerValues, setEqualizerValues] = useState({});
  // Logge jede Änderung am Equalizer
  const updateEqualizerValue = (key, value) => {
    setEqualizerValues((prev) => {
      const next = { ...prev, [key]: value };
      console.log('Equalizer update', key, value, next);
      return next;
    });
  };
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - (365));
  const [mode, setMode] = useState("real"); // Use generic 'real' instead of 'databricks'
  const currentModeRef = useRef(mode);
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const startStr = startDate.toLocaleDateString("sv-SE");
  const endStr = endDate.toLocaleDateString("sv-SE");

  // Independent page state for each table
  const [statsPage, setStatsPage] = useState(0);
  const [benchmarkPage, setBenchmarkPage] = useState(0);
  const [databricksPage, setDatabricksPage] = useState(0);
  const pageSize = 100; // or whatever value you want

  // useGenotypeStats jetzt für last-n, z.B. 100 Datensätze
  const { stats, totalPages: statsTotalPages, triggerRefresh } = useGenotypeStats({ limit: 100, page: statsPage });
  const {
    recentEvents: mapRecentEvents,
    currentEvent: mapCurrentEvent,
    currentValidation: mapCurrentValidation,
    loading: mapFeedLoading,
    error: mapFeedError,
    triggerRefresh: refreshGeoMapFeed,
  } = useGeoMapFeed();
  
  // useDatabricksStats für Databricks-Tabellendaten mit Paginierung
  const { stats: databricksStats, loading: databricksStatsLoading, totalCount: databricksTotalCount, triggerRefresh: refreshDatabricksStats } = useDatabricksStats({ limit: pageSize, page: databricksPage });

  // ✅ ADD: Missing handleModeChange function
  const handleModeChange = useCallback(
    (newMode) => {
      console.log(`🔄 Mode changing from ${mode} to ${newMode}`);
      setMode(newMode);
    },
    [mode]
  );

  // useGenotypeBenchmark jetzt für last-n, z.B. 100 Datensätze
  const {
    benchmark,
    loading: benchmarkLoading,
    goToPage,
    totalPages,
    triggerRefresh: refreshBenchmark,
  } = useGenotypeBenchmark({
    limit: pageSize,
    page: benchmarkPage,
    autoRefresh: false, // Only WebSocket triggers updates!
  });

  // Use the range hook for bar chart data
  // Normalize mode to match DB values: 'real' or 'prediction'
  const normalizedMode = mode === "predicted" ? "prediction" : "real";
  const {
    benchmark: benchmarkRange,
    loading: benchmarkRangeLoading,
    error: benchmarkRangeError,
    triggerRefresh: refreshBenchmarkRange,
  } = useGenotypeBenchmarkRange({
    startDate: startStr,
    endDate: endStr,
    sourceType: normalizedMode,
    autoRefresh: false, // We'll control refresh manually
  });
  console.log('Dashboard.jsx benchmarkRange:', benchmarkRange);

  const { card: onpremCard, loading: onpremLoading, triggerRefresh: refreshOnPrem } = useOnPremSimulation({
    startDate: startStr,
    endDate : endStr,
    mode: mode, // Pass the mode to the onprem simulation
    autoRefresh: false,
    equalizerValues,  
  });
  const { card: awsCard, loading: awsLoading, triggerRefresh: refreshAWS } = useAWSSimulation({
    startDate: startStr,
    endDate: endStr,
    mode: mode, // Pass the mode to the aws simulation
    autoRefresh: false,
    equalizerValues,
  });
  const { card: hybridCard, loading: hybridLoading, triggerRefresh: refreshHybrid } = useHybridSimulation({
    startDate: startStr,
    endDate: endStr,
    mode: mode, // Pass the mode to the hybrid simulation
    autoRefresh: false,
    equalizerValues,
  });
  const { usage, triggerRefresh: refreshPie } = usePieChartCapacity();
  const { card: databricksCard, loading: databricksLoading, triggerRefresh: refreshDatabricks } = useDatabricksSimulation({
    startDate: startStr,
    endDate: endStr,
    mode: mode, // Pass the mode to the databricks simulation
    autoRefresh: false,
    equalizerValues,
  });
  const { card: lakehouseOnPremCard, loading: lakehouseOnPremLoading, triggerRefresh: refreshLakehouseOnPrem } = useLakehouseOnPremSimulation({
    startDate: startStr,
    endDate: endStr,
    mode: mode, // Pass the mode to the lakehouse onprem simulation
    autoRefresh: false,
    equalizerValues,
  });

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [selectedArch, setSelectedArch] = useState("hybrid");

  // ✅ Keep ref updated
  useEffect(() => {
    currentModeRef.current = mode;
  }, [mode]);

  // 🚀 Auto-trigger simulators if they don't have data
  useEffect(() => {
    const hasValidDateRange = startDate && endDate;
    if (!hasValidDateRange) return;

    console.log("🔍 Checking simulators for data...");
    
    // Check and trigger each simulator if no data
    if (!onpremCard && !onpremLoading) {
      console.log("🚀 Triggering OnPrem simulator...");
      refreshOnPrem();
    }
    
    if (!awsCard && !awsLoading) {
      console.log("🚀 Triggering AWS simulator...");
      refreshAWS();
    }
    
    if (!hybridCard && !hybridLoading) {
      console.log("🚀 Triggering Hybrid simulator...");
      refreshHybrid();
    }
    
    if (!databricksCard && !databricksLoading) {
      console.log("🚀 Triggering Databricks simulator...");
      refreshDatabricks();
    }
    
    if (!lakehouseOnPremCard && !lakehouseOnPremLoading) {
      console.log("🚀 Triggering Lakehouse simulator...");
      refreshLakehouseOnPrem();
    }
  }, [startDate, endDate, onpremCard, awsCard, hybridCard, databricksCard, lakehouseOnPremCard, 
      onpremLoading, awsLoading, hybridLoading, databricksLoading, lakehouseOnPremLoading,
      refreshOnPrem, refreshAWS, refreshHybrid, refreshDatabricks, refreshLakehouseOnPrem]);

  // ⏱ Initial and socket-triggered refresh with latest date range
  useEffect(() => {
    const handleUpdate = () => {
      const currentMode = currentModeRef.current;
      console.log("📡 Socket: update received");
      console.log("📊 Stats during socket update:", stats);
      console.log(`📡 Socket: update received with mode: ${currentMode}`);
      setPulseTrigger((prev) => prev + 1);
      triggerRefresh();
      refreshBenchmark();
      refreshAWS();
      refreshHybrid();
      refreshOnPrem();
      refreshPie();
      refreshDatabricks();
      refreshDatabricksStats();
      refreshLakehouseOnPrem();
      refreshBenchmarkRange(); // Also refresh bar chart data
      refreshGeoMapFeed();
    };

    // Initial load
    handleUpdate();

    socket.on("update", handleUpdate);
    return () => socket.off("update", handleUpdate);
  }, [startDate, endDate, mode]); // Depend on mode as well

  // ✅ When user selects a new date range or mode manually
  useEffect(() => {
    console.log("📅 Date range or mode changed → refreshing Hybrid simulation and BarChartCost:", startDate, endDate, mode);
    refreshHybrid();
    refreshOnPrem();
    refreshAWS();
    refreshDatabricks();
    refreshLakehouseOnPrem();
    refreshBenchmarkRange(); // Refresh bar chart data
  }, [startDate, endDate, mode]);

  return (
    <main className="flex flex-col flex-1">
      <DashboardLayout
        benchmark={benchmark}
        benchmarkRange={benchmarkRange}
        benchmarkRangeLoading={benchmarkRangeLoading}
        stats={stats}
        databricksStats={databricksStats}
        mapRecentEvents={mapRecentEvents}
        mapCurrentEvent={mapCurrentEvent}
        mapCurrentValidation={mapCurrentValidation}
        mapFeedLoading={mapFeedLoading}
        mapFeedError={mapFeedError}
        statsPage={statsPage}
        setStatsPage={setStatsPage}
        benchmarkPage={benchmarkPage}
        setBenchmarkPage={setBenchmarkPage}
        databricksPage={databricksPage}
        setDatabricksPage={setDatabricksPage}
        pageSize={pageSize}
        goToPage={goToPage}
        totalPages={totalPages}
        statsTotalPages={statsTotalPages}
        databricksTotalPages={databricksTotalCount ? Math.ceil(databricksTotalCount / pageSize) : 1}
        usage={usage}
        awsCard={awsCard}
        onpremCard={onpremCard}
        hybridCard={hybridCard}
        databricksCard={databricksCard}
        lakehouseOnPremCard={lakehouseOnPremCard}
        pulseTrigger={pulseTrigger}
        selectedArch={selectedArch}
        setSelectedArch={setSelectedArch}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onpremLoading={onpremLoading}
        awsLoading={awsLoading}
        hybridLoading={hybridLoading}
        databricksLoading={databricksLoading}
        databricksStatsLoading={databricksStatsLoading}
        lakehouseOnPremLoading={lakehouseOnPremLoading}
        benchmarkLoading={benchmarkLoading}
        mode={mode}
        onModeChange={handleModeChange}
        equalizerValues={equalizerValues}
        updateEqualizerValue={updateEqualizerValue}
      />
    </main>
  );
}
