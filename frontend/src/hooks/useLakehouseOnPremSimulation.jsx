import { API_BASE_URL } from '../config/api';
import axios from "axios";
import { useCallback, useEffect, useState, useRef } from "react";

export default function useLakehouseOnPremSimulation({
  startDate,
  endDate,
  mode = 'real',
  autoRefresh = false,
  equalizerValues = {},
} = {}) {
  const [card, setCard] = useState(null);
  const [lakehouseOnPremLineChartData, setLakehouseOnPremLineChartData] = useState({
    compute: [],
    storage: [],
    energy: [],
    depreciation: [],
    lambda: [],
    s3: [],
    athena: [],
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
    console.log(`🚀 Lakehouse OnPrem Hook: Fetching data with mode: ${currentMode}`); // Add debug log
   
    if (!startDate || !endDate) {
      console.warn("⏳ Waiting for valid date range...");
      return;
    }
    const eqKey = equalizerValues && Object.keys(equalizerValues).length > 0
      ? JSON.stringify(equalizerValues)
      : '';
    const cacheKey = `lakehouse_onprem:${currentMode}:${startDate}:${endDate}:${eqKey}`;
    const now = Date.now();
    if (cacheKey === lastKeyRef.current && lastDataRef.current && (now - lastTsRef.current) < cacheTtlMs) {
      console.log(`♻️ useLakehouseOnPremSimulation using cached response for ${cacheKey}`);
      const data = lastDataRef.current;
      const summary = data?.summary ?? {};
      const storage = data?.daily_storage_costs ?? [];
      const compute = data?.daily_compute_costs ?? [];
      const energy = data?.daily_energy_costs ?? [];
      const depreciation = data?.daily_depreciation_costs ?? [];
      const lambda = data?.daily_lambda_costs ?? [];
      const s3 = data?.daily_s3_costs ?? [];
      const athena = data?.daily_athena_costs ?? [];
      const dates = data?.dates ?? [];

      if (storage.length === 0 || compute.length === 0) {
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Lakehouse OnPrem"}${modeLabel}`,
          value: summary?.["Total (€)"] || 0,
          change: 0,
          computeData: [],
          storageData: [],
          energyData: [],
          depreciationData: [],
          lambdaData: [],
          s3Data: [],
          athenaData: [],
          dates: [],
          mode: currentMode,
          summary,
        });
        setLakehouseOnPremLineChartData({
          compute: [],
          storage: [],
          energy: [],
          depreciation: [],
          lambda: [],
          s3: [],
          athena: [],
        });
      } else {
        const dailyTotals = storage.map((s, i) =>
          (s || 0) + (compute[i] || 0) + (energy[i] || 0) + (depreciation[i] || 0) +
          (lambda[i] || 0) + (s3[i] || 0) + (athena[i] || 0)
        );
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Lakehouse OnPrem"}${modeLabel}`,
          value: data?.summary?.["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          computeData: compute,
          storageData: storage,
          energyData: energy,
          depreciationData: depreciation,
          lambdaData: lambda,
          s3Data: s3,
          athenaData: athena,
          dates: dates,
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });
        setLakehouseOnPremLineChartData({
          compute,
          storage,
          energy,
          depreciation,
          lambda,
          s3,
          athena,
        });
      }
      setLoading(false);
      return;
    }
    if (inFlightRef.current === cacheKey) {
      console.log(`⏳ useLakehouseOnPremSimulation request already in flight for ${cacheKey}`);
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
      equalizer: JSON.stringify(equalizerValues ?? {}),
    };

  console.log("Equalizer sent to backend (LakehouseOnPrem):", equalizerValues);

    axios
      .get(`${API_BASE_URL}/api/simulation-stats/lakehouse_onprem`, { params })
      .then((response) => {
        const data = response.data;
        lastKeyRef.current = cacheKey;
        lastDataRef.current = data;
        lastTsRef.current = Date.now();

        if (data.error) {
          throw new Error(data.error);
        }

        console.log("✅ Lakehouse OnPrem Simulation Response:", data);

        // ✅ Extract data arrays
        const summary = data?.summary ?? {};
        const storage = data?.daily_storage_costs ?? [];
        const compute = data?.daily_compute_costs ?? [];
        const energy = data?.daily_energy_costs ?? [];
        const depreciation = data?.daily_depreciation_costs ?? [];
        const lambda = data?.daily_lambda_costs ?? [];
        const s3 = data?.daily_s3_costs ?? [];
        const athena = data?.daily_athena_costs ?? [];
        const dates = data?.dates ?? [];

        // ✅ Validate arrays
        if (!Array.isArray(storage) || !Array.isArray(compute) || !Array.isArray(energy) ||
            !Array.isArray(depreciation) || !Array.isArray(lambda) || !Array.isArray(s3) || !Array.isArray(athena)) {
          console.error("⚠️ Incomplete simulation data:", { storage, compute, energy, depreciation, lambda, s3, athena });
          throw new Error("Incomplete simulation data");
        }

        // ✅ Handle empty data case
        if (storage.length === 0 || compute.length === 0) {
          console.warn(`⚠️ No data available for date range ${startDate} to ${endDate} in ${currentMode} mode`);
          const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
          setCard({
            label: `${data?.name || "Lakehouse OnPrem"}${modeLabel}`,
            value: summary?.["Total (€)"] || 0,
            change: 0,
            computeData: [],
            storageData: [],
            energyData: [],
            depreciationData: [],
            lambdaData: [],
            s3Data: [],
            athenaData: [],
            dates: [],
            mode: currentMode,
            summary,
          });
          setLakehouseOnPremLineChartData({
            compute: [],
            storage: [],
            energy: [],
            depreciation: [],
            lambda: [],
            s3: [],
            athena: [],
          });
          setLoading(false);
          return;
        }

        // ✅ Calculate change percentage
        const dailyTotals = storage.map((s, i) => 
          (s || 0) + (compute[i] || 0) + (energy[i] || 0) + (depreciation[i] || 0) + 
          (lambda[i] || 0) + (s3[i] || 0) + (athena[i] || 0)
        );
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;

        // ✅ Determine mode label based on current mode
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';

        setCard({
          label: `${data?.name || "Lakehouse OnPrem"}${modeLabel}`,
          value: data?.summary?.["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)), // ✅ Use calculated change
          computeData: compute,
          storageData: storage,
          energyData: energy,
          depreciationData: depreciation,
          lambdaData: lambda,
          s3Data: s3,
          athenaData: athena,
          dates: dates,
          mode: currentMode, // ✅ Add mode field
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });

        setLakehouseOnPremLineChartData({
          compute,
          storage,
          energy,
          depreciation,
          lambda,
          s3,
          athena,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lakehouse OnPrem Simulation Error:", err?.response?.data || err.message);
        setError(err.message || "Unknown error");
        setCard(null);
        setLakehouseOnPremLineChartData({
          compute: [],
          storage: [],
          energy: [],
          depreciation: [],
          lambda: [],
          s3: [],
          athena: [],
        });
        setDates([]);
        setLoading(false);
      })
      .finally(() => {
        if (inFlightRef.current === cacheKey) {
          inFlightRef.current = null;
        }
      });
  }, [startDate, endDate , mode, equalizerValues]);

  // ✅ FIX 1: Add triggerRefresh to dependencies and handle autoRefresh
  useEffect(() => {
    if (false && autoRefresh && startDate && endDate) {
      triggerRefresh();
    }
  }, [autoRefresh, startDate, endDate, triggerRefresh , equalizerValues]);

  // ✅ FIX 2: Add mode change handler
  useEffect(() => {
    if (prevModeRef.current !== mode && startDate && endDate && !autoRefresh) {
      console.log(`🔄 Lakehouse OnPrem Mode changed from ${prevModeRef.current} to ${mode}`);
      triggerRefresh();
    }
    prevModeRef.current = mode;
  }, [mode, triggerRefresh, startDate, endDate, equalizerValues]);

  // ✅ ADD: Return currentMode for debugging/display purposes
  return { 
    card, 
    lakehouseOnPremLineChartData, 
    loading, 
    error, 
    triggerRefresh,
    currentMode: currentModeRef.current
  };
}
