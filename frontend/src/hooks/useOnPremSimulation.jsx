import { API_BASE_URL } from '../config/api';
import axios from "axios";
import { useCallback, useEffect, useState, useRef } from "react";

export default function useOnPremSimulation({
  startDate,
  endDate,
  mode = 'real',
  autoRefresh = false,
  equalizerValues = {},
} = {}) {
  const [card, setCard] = useState(null);
  const [onpremLineChartData, setLineChartData] = useState({
    compute: [],
    storage: [],
    energy: [],
    depreciation: [],
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
    const currentMode = currentModeRef.current;
    console.log(`🚀 useOnPrem Hook: Fetching data with mode: ${currentMode}`);
    if (!startDate || !endDate) {
      console.warn("⏳ Waiting for valid date range...");
      return;
    }
    const eqKey = equalizerValues && Object.keys(equalizerValues).length > 0
      ? JSON.stringify(equalizerValues)
      : '';
    const cacheKey = `onprem:${currentMode}:${startDate}:${endDate}:${eqKey}`;
    const now = Date.now();
    if (cacheKey === lastKeyRef.current && lastDataRef.current && (now - lastTsRef.current) < cacheTtlMs) {
      console.log(`♻️ useOnPremSimulation using cached response for ${cacheKey}`);
      const data = lastDataRef.current;
      const summary = data?.summary ?? {};
      const compute = data?.daily_compute_costs ?? [];
      const storage = data?.daily_storage_costs ?? [];
      const energy = data?.daily_energy_costs ?? [];
      const depreciation = data?.daily_depreciation_costs ?? [];
      const dates = data?.dates ?? [];

      if (compute.length === 0 || storage.length === 0 || energy.length === 0 || depreciation.length === 0) {
        setCard({
          label: data?.name || "OnPrem",
          value: summary["Total (€)"] || 0,
          change: 0,
          computeData: [],
          storageData: [],
          energyData: [],
          depreciationData: [],
          dates: [],
          mode: currentMode,
          summary,
        });
        setLineChartData({ compute: [], storage: [], energy: [], depreciation: [] });
      } else {
        const dailyTotals = storage.map(
          (_, i) =>
            (compute[i] || 0) +
            (storage[i] || 0) +
            (energy[i] || 0) +
            (depreciation[i] || 0)
        );
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "OnPrem"}${modeLabel}`,
          value: summary["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          computeData: compute,
          storageData: storage,
          energyData: energy,
          depreciationData: depreciation,
          dates: dates,
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });
        setLineChartData({ compute, storage, energy, depreciation });
      }
      setLoading(false);
      return;
    }
    if (inFlightRef.current === cacheKey) {
      console.log(`⏳ useOnPremSimulation request already in flight for ${cacheKey}`);
      return;
    }
    inFlightRef.current = cacheKey;
    setError(null);
    setLoading(true);
    const params = {
      startDate,
      endDate,
      _: Date.now(),
    };
    if (currentMode === 'predicted') {
      params.mode = 'predicted';
    } else {
      params.mode = 'real';
    }
    // Gleich wie AWS: equalizer als Query-String übergeben
    if (equalizerValues && Object.keys(equalizerValues).length > 0) {
      params.equalizer = JSON.stringify(equalizerValues);
    }
    console.log("Equalizer sent to backend (OnPrem):", equalizerValues);
    axios
      .get(`${API_BASE_URL}/mock/onprem-simulation-mock.json`, {
        params,
      })
      .then((res) => {
        console.log("✅ useOnPremSimulation response:", res.data);
        const data = res.data;
        lastKeyRef.current = cacheKey;
        lastDataRef.current = data;
        lastTsRef.current = Date.now();
        const summary = data?.summary ?? {};
        const compute = data?.daily_compute_costs ?? [];
        const storage = data?.daily_storage_costs ?? [];
        const energy = data?.daily_energy_costs ?? [];
        const depreciation = data?.daily_depreciation_costs ?? [];
        const dates = data?.dates ?? [];

        if (!Array.isArray(compute) || !Array.isArray(storage) || !Array.isArray(energy) || !Array.isArray(depreciation)) {
          console.error("⚠️ Incomplete simulation data:", { compute, storage, energy, depreciation });
          throw new Error("⚠️ Incomplete simulation data");
        }

        // ✅ ADD THIS BLOCK HERE - right after array validation
        if (compute.length === 0 || storage.length === 0 || energy.length === 0 || depreciation.length === 0) {
          console.warn(`⚠️ No data available for date range ${startDate} to ${endDate} in ${currentMode} mode`);
          setCard({
            label: data?.name || "OnPrem",
            value: summary["Total (€)"] || 0,
            change: 0,
            computeData: [],
            storageData: [],
            energyData: [],
            depreciationData: [],
            dates: [],
            mode: currentMode,
            summary,
          });
          setLineChartData({ compute: [], storage: [], energy: [], depreciation: [] });
          setLoading(false);
          return;
        }

        const dailyTotals = storage.map(
          (_, i) =>
            (compute[i] || 0) +
            (storage[i] || 0) +
            (energy[i] || 0) +
            (depreciation[i] || 0)
        );

        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;

        // Add mode indicator to the label for clarity
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "OnPrem"}${modeLabel}`,
          value: summary["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          computeData: compute,
          storageData: storage,
          energyData: energy,
          depreciationData: depreciation,
          dates: dates,
          mode: currentMode,
          // Add total_size_gb and total_download_time_sec to card
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });

        setLineChartData({ compute, storage, energy, depreciation });
        setLoading(false);
      })
      .catch((err) => {
        console.error(
          "❌ useOnPremSimulation failed:",
          err?.response?.data || err.message
        );
        setError(err.message || "Unknown error");
        setCard(null);
        setLineChartData({
          compute: [],
          storage: [],
          energy: [],
          depreciation: [],
        });
        setLoading(false);
      })
      .finally(() => {
        if (inFlightRef.current === cacheKey) {
          inFlightRef.current = null;
        }
      });
  }, [startDate, endDate, mode, equalizerValues]);

  // ✅ FIX 1: Add triggerRefresh to dependencies
  useEffect(() => {
    if (startDate && endDate) {
      triggerRefresh();
    }
  }, [equalizerValues, startDate, endDate, mode, triggerRefresh]);

  // ✅ FIX 2: Add mode change handler
  useEffect(() => {
    if (prevModeRef.current !== mode && startDate && endDate && !autoRefresh) {
      console.log(`🎯 OnPrem Mode changed from ${prevModeRef.current} to ${mode}`);
      triggerRefresh();
    }
    prevModeRef.current = mode;
  }, [mode, triggerRefresh, startDate, endDate , equalizerValues]);

  return {
    card,
    onpremLineChartData,
    loading,
    error,
    triggerRefresh,
    currentMode: currentModeRef.current,
  };
}
