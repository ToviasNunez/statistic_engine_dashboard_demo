import { useCallback, useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useGenotypeStats } from "../hooks/useGenotypeStats";
import { useGenotypeBenchmark } from "../hooks/useGenotypeBenchmark";
import { useDatabricksStats } from "../hooks/useDatabricksStats";
import useAWSSimulation from "../hooks/useAWSSimulation";
import useDatabricksSimulation from "../hooks/useDatabricksSimulation";
import useHybridSimulation from "../hooks/useHybridSimulation";
import useOnPremSimulation from "../hooks/useOnPremSimulation";
import useLakehouseOnPremSimulation from "../hooks/useLakehouseOnPremSimulation";
import usePieChartCapacity from "../hooks/usePieChartCapacity";
import { useGenotypeBenchmarkRange } from "../hooks/useGenotypeBenchmarkRange";
import { useGeoMapFeed } from "../hooks/useGeoMapFeed";

export default function Dashboard() {
  const [equalizerValues, setEqualizerValues] = useState({});

  const updateEqualizerValue = (key, value) => {
    setEqualizerValues((prev) => {
      const next = { ...prev, [key]: value };
      console.log("Equalizer update", key, value, next);
      return next;
    });
  };

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [mode, setMode] = useState("real");
  const currentModeRef = useRef(mode);
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const startStr = startDate.toLocaleDateString("sv-SE");
  const endStr = endDate.toLocaleDateString("sv-SE");

  const [statsPage, setStatsPage] = useState(0);
  const [benchmarkPage, setBenchmarkPage] = useState(0);
  const [databricksPage, setDatabricksPage] = useState(0);
  const pageSize = 100;

  const { stats, totalPages: statsTotalPages, triggerRefresh } = useGenotypeStats({
    limit: 100,
    page: statsPage,
  });

  const {
    recentEvents: mapRecentEvents,
    currentEvent: mapCurrentEvent,
    currentValidation: mapCurrentValidation,
    loading: mapFeedLoading,
    error: mapFeedError,
    triggerRefresh: refreshGeoMapFeed,
  } = useGeoMapFeed();

  const {
    stats: databricksStats,
    loading: databricksStatsLoading,
    totalCount: databricksTotalCount,
    triggerRefresh: refreshDatabricksStats,
  } = useDatabricksStats({
    limit: pageSize,
    page: databricksPage,
  });

  const handleModeChange = useCallback(
    (newMode) => {
      console.log(`🔄 Mode changing from ${mode} to ${newMode}`);
      setMode(newMode);
    },
    [mode]
  );

  const {
    benchmark,
    loading: benchmarkLoading,
    goToPage,
    totalPages,
    triggerRefresh: refreshBenchmark,
  } = useGenotypeBenchmark({
    limit: pageSize,
    page: benchmarkPage,
    autoRefresh: false,
  });

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
    autoRefresh: false,
  });

  console.log("Dashboard.jsx benchmarkRange:", benchmarkRange);
  console.log("Dashboard.jsx benchmarkRangeError:", benchmarkRangeError);

  const {
    card: onpremCard,
    loading: onpremLoading,
    triggerRefresh: refreshOnPrem,
  } = useOnPremSimulation({
    startDate: startStr,
    endDate: endStr,
    mode,
    autoRefresh: false,
    equalizerValues,
  });

  const {
    card: awsCard,
    loading: awsLoading,
    triggerRefresh: refreshAWS,
  } = useAWSSimulation({
    startDate: startStr,
    endDate: endStr,
    mode,
    autoRefresh: false,
    equalizerValues,
  });

  const {
    card: hybridCard,
    loading: hybridLoading,
    triggerRefresh: refreshHybrid,
  } = useHybridSimulation({
    startDate: startStr,
    endDate: endStr,
    mode,
    autoRefresh: false,
    equalizerValues,
  });

  const { usage, triggerRefresh: refreshPie } = usePieChartCapacity();

  const {
    card: databricksCard,
    loading: databricksLoading,
    triggerRefresh: refreshDatabricks,
  } = useDatabricksSimulation({
    startDate: startStr,
    endDate: endStr,
    mode,
    autoRefresh: false,
    equalizerValues,
  });

  const {
    card: lakehouseOnPremCard,
    loading: lakehouseOnPremLoading,
    triggerRefresh: refreshLakehouseOnPrem,
  } = useLakehouseOnPremSimulation({
    startDate: startStr,
    endDate: endStr,
    mode,
    autoRefresh: false,
    equalizerValues,
  });

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [selectedArch, setSelectedArch] = useState("hybrid");

  useEffect(() => {
    currentModeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const hasValidDateRange = startDate && endDate;
    if (!hasValidDateRange) return;

    console.log("🔍 Checking simulators for data...");

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
  }, [
    startDate,
    endDate,
    onpremCard,
    awsCard,
    hybridCard,
    databricksCard,
    lakehouseOnPremCard,
    onpremLoading,
    awsLoading,
    hybridLoading,
    databricksLoading,
    lakehouseOnPremLoading,
    refreshOnPrem,
    refreshAWS,
    refreshHybrid,
    refreshDatabricks,
    refreshLakehouseOnPrem,
  ]);

  // Initial refresh only - no socket
  useEffect(() => {
    const handleUpdate = () => {
      const currentMode = currentModeRef.current;
      console.log("📡 Initial refresh");
      console.log("📊 Stats during refresh:", stats);
      console.log(`📡 Refresh with mode: ${currentMode}`);

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
      refreshBenchmarkRange();
      refreshGeoMapFeed();
    };

    handleUpdate();
  }, []);

  useEffect(() => {
    console.log(
      "📅 Date range or mode changed → refreshing Hybrid simulation and BarChartCost:",
      startDate,
      endDate,
      mode
    );
    refreshHybrid();
    refreshOnPrem();
    refreshAWS();
    refreshDatabricks();
    refreshLakehouseOnPrem();
    refreshBenchmarkRange();
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