import { API_BASE_URL } from '../config/api';
import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";

export default function useHybridSimulation({
  startDate,
  endDate,
  mode = 'real',
  autoRefresh = false,
  equalizerValues = {},
} = {}) {
  const [card, setCard] = useState(null);
  const [lineChartData, setLineChartData] = useState({
    s3: [],
    sql: [],
    storage: [],
    compute: [],
    transfer: [],
  });
  const [dates, setDates] = useState([]);
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
    console.log(`🚀 Hybrid Hook: Fetching data with mode: ${currentMode}`); // Add debug log
   
    if (!startDate || !endDate) {
      console.warn("⏳ Waiting for valid date range...");
      return;
    }
    const eqKey = equalizerValues && Object.keys(equalizerValues).length > 0
      ? JSON.stringify(equalizerValues)
      : '';
    const cacheKey = `hybrid:${currentMode}:${startDate}:${endDate}:${eqKey}`;
    const now = Date.now();
    if (cacheKey === lastKeyRef.current && lastDataRef.current && (now - lastTsRef.current) < cacheTtlMs) {
      console.log(`♻️ useHybridSimulation using cached response for ${cacheKey}`);
      const data = lastDataRef.current;
      const s3 = data?.daily_storage_cloud_costs ?? [];
      const sql = data?.daily_storage_sql_costs ?? [];
      const storage = data?.daily_storage_costs ?? [];
      const compute = data?.daily_etl_costs ?? [];
      const transfer = data?.daily_transfer_costs ?? [];
      const summary = data?.summary ?? {};
      const dateArray = data?.dates ?? [];

      if (s3.length === 0 || sql.length === 0 || storage.length === 0 || compute.length === 0 || transfer.length === 0) {
        setCard({
          label: data?.name || "Hybrid",
          value: summary["Total (€)"] || 0,
          change: 0,
          s3Data: [],
          sqlData: [],
          storageData: [],
          computeData: [],
          transferData: [],
          dates: [],
          mode: currentMode,
          summary,
        });
        setLineChartData({ s3: [], sql: [], storage: [], compute: [], transfer: [] });
        setDates([]);
      } else {
        const dailyTotals = s3.map((_, i) =>
          (s3[i] || 0) + (sql[i] || 0) + (compute[i] || 0) + (transfer[i] || 0)
        );

        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Hybrid"}${modeLabel}`,
          value: summary["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          s3Data: s3,
          sqlData: sql,
          storageData: storage,
          computeData: compute,
          transferData: transfer,
          dates: dateArray,
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });
        setLineChartData({ s3, sql, storage, compute, transfer });
        setDates(dateArray);
      }
      setLoading(false);
      return;
    }
    if (inFlightRef.current === cacheKey) {
      console.log(`⏳ useHybridSimulation request already in flight for ${cacheKey}`);
      return;
    }
    inFlightRef.current = cacheKey;

    setError(null);
    setLoading(true);

    const params = {
      startDate,
      endDate,
      _: Date.now(), // optional cache buster
      mode: currentMode === 'predicted' ? 'predicted' : 'real',
    };
   
    // Add equalizer as query string if it exists
    if (equalizerValues && Object.keys(equalizerValues).length > 0) {
      params.equalizer = JSON.stringify(equalizerValues);
    }
    console.log("Equalizer sent to backend (Hybrid):", equalizerValues);
    axios
      .get(`${API_BASE_URL}/api/simulation-stats/hybrid`, {
        params
      })
      .then((res) => {
        const data = res.data;
        console.log("✅ useHybridSimulation response:", data);
        lastKeyRef.current = cacheKey;
        lastDataRef.current = data;
        lastTsRef.current = Date.now();
        const s3 = data?.daily_storage_cloud_costs ?? [];
        const sql = data?.daily_storage_sql_costs ?? [];
        const storage = data?.daily_storage_costs ?? [];
        const compute = data?.daily_etl_costs ?? [];
        const transfer = data?.daily_transfer_costs ?? [];
        const summary = data?.summary ?? {};
        const dateArray = data?.dates ?? [];

        if (
          !Array.isArray(s3) ||
          !Array.isArray(sql) ||
          !Array.isArray(storage) ||
          !Array.isArray(compute) ||
          !Array.isArray(transfer)
        ) {
          console.error("⚠️ Incomplete simulation data:", { s3, sql, storage, compute, transfer });
          throw new Error("⚠️ Incomplete simulation data");
        }

        // ✅ ADD THIS BLOCK HERE - right after array validation
        if (s3.length === 0 || sql.length === 0 || storage.length === 0 || compute.length === 0 || transfer.length === 0) {
          console.warn(`⚠️ No data available for date range ${startDate} to ${endDate} in ${currentMode} mode`);
          setCard({
            label: data?.name || "Hybrid",
            value: summary["Total (€)"] || 0,
            change: 0,
            s3Data: [],
            sqlData: [],
            storageData: [],
            computeData: [],
            transferData: [],
            dates: [],
            mode: currentMode,
          });
          setLineChartData({ s3: [], sql: [], storage: [], compute: [], transfer: [] });
          setDates([]);
          setLoading(false);
          return;
        }

        const dailyTotals = s3.map((_, i) =>
          (s3[i] || 0) + (sql[i] || 0) + (compute[i] || 0) + (transfer[i] || 0)
        );

        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;

        // Add mode indicator to the label for clarity
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "Hybrid"}${modeLabel}`,
          value: summary["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          s3Data: s3,
          sqlData: sql,
          storageData: storage,
          computeData: compute,
          transferData: transfer,
          dates: dateArray,
          mode: currentMode,
          totalSizeGB: data?.total_size_gb ?? 0,
          totalDownloadTimeSec: data?.total_download_time_sec ?? 0,
          summary,
        });

        setLineChartData({ s3, sql, storage, compute, transfer });
        setDates(dateArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useHybridSimulation failed:", err?.response?.data || err.message);
        setError(err.message || "Unknown error");
        setCard(null);
        setLineChartData({ s3: [], sql: [], storage: [], compute: [], transfer: [] });
        setDates([]);
        setLoading(false);
      })
      .finally(() => {
        if (inFlightRef.current === cacheKey) {
          inFlightRef.current = null;
        }
      });
  }, [startDate, endDate, mode , equalizerValues]);

  // Automatischer Trigger bei jeder Änderung von startDate, endDate oder mode
  useEffect(() => {
    if (startDate && endDate) {
      triggerRefresh();
    }
  }, [startDate, endDate, mode, triggerRefresh, equalizerValues]);

 // ✅ FIX 2: Add mode change handler
  useEffect(() => {
    if (prevModeRef.current !== mode && startDate && endDate && !autoRefresh) {
      console.log(`🎯 Hybrid Mode changed from ${prevModeRef.current} to ${mode}`);
      triggerRefresh();
    }
    prevModeRef.current = mode;
  }, [mode, triggerRefresh, startDate, endDate , equalizerValues]);

  return {
    card,
    lineChartData,
    dates,
    loading,
    error,
    triggerRefresh,
    currentMode: currentModeRef.current,
  };
}
