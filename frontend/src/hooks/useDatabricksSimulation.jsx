import axios from "axios";
import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

export default function useDatabricksSimulation({
  startDate,
  endDate,
  mode = 'real',
  autoRefresh = false,
  equalizerValues = {},
} = {}) {
  const [card, setCard] = useState(null);
  const [lineChartData, setLineChartData] = useState({
    storage: [],
    compute: [],
    egress: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   // ✅ Track previous mode to detect changes
  const prevModeRef = useRef(mode);
  const currentModeRef = useRef(mode);
  const lastKeyRef = useRef('');
  const lastDataRef = useRef(null);
  const lastTsRef = useRef(0);
  const inFlightRef = useRef(null);
  const cacheTtlMs = 25000;


    // ✅ ADD THIS: Update currentModeRef when mode changes
  useEffect(() => {
    currentModeRef.current = mode;
  }, [mode]);
  
  const triggerRefresh = useCallback(() => {
    const currentMode = currentModeRef.current; // ✅ Use ref for current mode
    console.log(`🚀 Hook: Fetching data with mode: ${currentMode}`); // Add debug log
   
    if (!startDate || !endDate) {
      console.warn("⏳ Waiting for valid date range...");
      return;
    }
    const eqKey = equalizerValues && Object.keys(equalizerValues).length > 0
      ? JSON.stringify(equalizerValues)
      : '';
    const cacheKey = `databricks:${currentMode}:${startDate}:${endDate}:${eqKey}`;
    const now = Date.now();
    if (cacheKey === lastKeyRef.current && lastDataRef.current && (now - lastTsRef.current) < cacheTtlMs) {
      console.log(`♻️ useDatabricksSimulation using cached response for ${cacheKey}`);
      const data = lastDataRef.current;
      const summary = data?.summary ?? {};
      const cardsArr = Array.isArray(data.cards) ? data.cards : [];
      const valueFromCards = cardsArr.find(c => /total/i.test(String(c.name)))?.value;
      const summaryTotal = summary["Total (EUR)"] || summary["Total (€)"] || summary["Total"];
      const displayValue = typeof data.value !== 'undefined' ? data.value : (summaryTotal ?? valueFromCards ?? 0);

      const compute = data.computeData ?? data.daily_compute_costs ?? data.dailyComputeCosts ?? [];
      const storage = data.storageData ?? data.daily_storage_costs ?? data.dailyStorageCosts ?? [];
      const egress = data.egressData ?? data.daily_egress_costs ?? data.dailyEgressCosts ?? [];
      const dates = data.dates ?? [];

      if (storage.length === 0 && compute.length === 0 && egress.length === 0) {
        setCard({
          label: data?.name || "Databricks",
          value: displayValue,
          change: 0,
          storageData: [],
          computeData: [],
          egressData: [],
          dates: [],
          mode: currentMode,
          summary,
        });
        setLineChartData({ compute: [], storage: [], egress: [] });
      } else {
        const dailyTotals = storage.map((s, i) => (s || 0) + (compute[i] || 0) + (egress[i] || 0));
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Databricks"}${modeLabel}`,
          value: displayValue,
          change: parseFloat(change.toFixed(1)),
          storageData: storage,
          computeData: compute,
          egressData: egress,
          dates: dates ?? [],
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });
        setLineChartData({ compute, storage, egress });
      }
      setLoading(false);
      return;
    }
    if (inFlightRef.current === cacheKey) {
      console.log(`⏳ useDatabricksSimulation request already in flight for ${cacheKey}`);
      return;
    }
    inFlightRef.current = cacheKey;

    setError(null);
    setLoading(true);

        const params = {
          startDate,
          endDate,
          _: Date.now(), // Optional: cache buster
          mode: currentMode === 'predicted' ? 'predicted' : 'real',
        };
        if (equalizerValues && Object.keys(equalizerValues).length > 0) {
          params.equalizer = JSON.stringify(equalizerValues);
        }
        console.log("Equalizer sent to backend (Databricks):", equalizerValues);

    axios
      .get(`${API_BASE_URL}/mock/databricks-simulation-mock.json`, {
        params
      })
      .then((res) => {
          console.log("✅ useDatabricksSimulation response:", res.data);
        const data = res.data;
        lastKeyRef.current = cacheKey;
        lastDataRef.current = data;
        lastTsRef.current = Date.now();
        const summary = data?.summary ?? {};
        // Fallbacks für verschiedene Backend-Response-Varianten
        const cardsArr = Array.isArray(data.cards) ? data.cards : [];
        const valueFromCards = cardsArr.find(c => /total/i.test(String(c.name)))?.value;
        const summaryTotal = summary["Total (EUR)"] || summary["Total (€)"] || summary["Total"];
        const displayValue = typeof data.value !== 'undefined' ? data.value : (summaryTotal ?? valueFromCards ?? 0);

        // Flexible Zeitreihen-Extraktion
        const compute = data.computeData ?? data.daily_compute_costs ?? data.dailyComputeCosts ?? [];
        const storage = data.storageData ?? data.daily_storage_costs ?? data.dailyStorageCosts ?? [];
        const egress = data.egressData ?? data.daily_egress_costs ?? data.dailyEgressCosts ?? [];
        const dates = data.dates ?? [];

        if (!Array.isArray(storage) || !Array.isArray(compute) || !Array.isArray(egress)) {
          console.error("⚠️ Incomplete simulation data:", { storage, compute, egress });
          throw new Error("Incomplete simulation data");
        }

        if (storage.length === 0 && compute.length === 0 && egress.length === 0) {
          console.warn(`⚠️ No data available for date range ${startDate} to ${endDate} in ${currentMode} mode`);
          setCard({
            label: data?.name || "Databricks",
            value: displayValue,
            change: 0,
            storageData: [],
            computeData: [],
            egressData: [],
            dates: [],
            mode: currentMode,
            summary,
          });
          setLineChartData({ compute: [], storage: [], egress: [] });
          setLoading(false);
          return;
        }

        const dailyTotals = storage.map((s, i) => (s || 0) + (compute[i] || 0) + (egress[i] || 0));
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;

        // Add mode indicator to the label for clarity
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Databricks"}${modeLabel}`,
          value: displayValue,
          change: parseFloat(change.toFixed(1)),
          storageData: storage,
          computeData: compute,
          egressData: egress,
          dates: dates ?? [],
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });

        setLineChartData({
          compute,
          storage,
          egress,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useDatabricksSimulation failed:", err?.response?.data || err.message);
        setError(err.message || "Unknown error");
        setCard(null);
        setLineChartData({ compute: [], storage: [], egress: [] });
        setLoading(false);
      })
      .finally(() => {
        if (inFlightRef.current === cacheKey) {
          inFlightRef.current = null;
        }
      });
  }, [startDate, endDate , mode,equalizerValues]);


  // Automatischer Trigger bei jeder Änderung von equalizerValues, startDate, endDate oder mode
  useEffect(() => {
    if (startDate && endDate) {
      triggerRefresh();
    }
  }, [equalizerValues, startDate, endDate, mode, triggerRefresh]);


  // ✅ FIX 2: Add mode change handler
  useEffect(() => {
    if (prevModeRef.current !== mode && startDate && endDate && !autoRefresh) {
      console.log(`🎯 Databricks Mode changed from ${prevModeRef.current} to ${mode}`);
      triggerRefresh();
    }
    prevModeRef.current = mode;
  }, [mode, triggerRefresh, startDate, endDate , equalizerValues]);

  return {
    card,
    lineChartData,
    loading,
    error,
    triggerRefresh,
    currentMode: currentModeRef.current,
  };
}
