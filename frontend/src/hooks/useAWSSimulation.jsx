import axios from 'axios';
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

export default function useAWSSimulation({
  startDate,
  endDate,
  mode = 'real',
  autoRefresh = false,
  equalizerValues = {},
} = {}) {
  const [card, setCard] = useState(null);
  const [awsLineChartData, setLineChartData] = useState({
    compute: [],
    storage: [],
    transfer: [],
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
    console.log(`🚀 AWS Hook: Fetching data with mode: ${currentMode}`); // Add debug log
   
    if (!startDate || !endDate) {
      console.warn("⏳ Waiting for valid date range...");
      return;
    }
    const eqKey = equalizerValues && Object.keys(equalizerValues).length > 0
      ? JSON.stringify(equalizerValues)
      : '';
    const cacheKey = `aws:${currentMode}:${startDate}:${endDate}:${eqKey}`;
    const now = Date.now();
    if (cacheKey === lastKeyRef.current && lastDataRef.current && (now - lastTsRef.current) < cacheTtlMs) {
      console.log(`♻️ useAWSSimulation using cached response for ${cacheKey}`);
      const data = lastDataRef.current;
      const summary = data?.summary ?? {};
      const compute = data?.daily_athena_costs ?? [];
      const storage = data?.daily_storage_costs ?? [];
      const transfer = data?.daily_transfer_costs ?? [];
      const dates = data?.dates ?? [];
      const totalSizeGB = data?.total_size_gb ?? 0;
      const totalDownloadTimeSec = data?.total_download_time_sec ?? 0;

      if (storage.length === 0 || compute.length === 0 || transfer.length === 0) {
        setCard({
          label: data?.name || "AWS Lakehouse",
          value: summary?.["Total (€)"] || 0,
          change: 0,
          computeData: [],
          storageData: [],
          transferData: [],
          dates: [],
          mode: currentMode,
          totalSizeGB,
          totalDownloadTimeSec,
          summary,
        });
        setLineChartData({ compute: [], storage: [], transfer: [] });
      } else {
        const dailyTotals = storage.map(
          (s, i) => (s || 0) + (compute[i] || 0) + (transfer[i] || 0)
        );
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "AWS Lakehouse"}${modeLabel}`,
          value: summary?.["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          computeData: compute,
          storageData: storage,
          transferData: transfer,
          dates: dates ?? [],
          mode: currentMode,
          totalSizeGB,
          totalDownloadTimeSec,
          summary,
        });
        setLineChartData({ compute, storage, transfer });
      }
      setLoading(false);
      return;
    }
    if (inFlightRef.current === cacheKey) {
      console.log(`⏳ useAWSSimulation request already in flight for ${cacheKey}`);
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
    

    // Añadir equalizer como query string si existe
    if (equalizerValues && Object.keys(equalizerValues).length > 0) {
      params.equalizer = JSON.stringify(equalizerValues);
    }
    console.log("Equalizer sent to backend: (AWS)", equalizerValues);
    // Wenn API_BASE_URL explizit 'mock' ist, lade Mockdaten aus dem Projekt
    const url =  `${API_BASE_URL}/mock/aws-simulation-mock.json`;
    axios
      .get(url, {
        params
      })
      .then((res) => {

        console.log("✅ useAWSSimulation response:", res.data);
        const data = res.data;
        lastKeyRef.current = cacheKey;
        lastDataRef.current = data;
        lastTsRef.current = Date.now();
        const summary = data?.summary ?? {};
        const compute = data?.daily_athena_costs ?? [];
        const storage = data?.daily_storage_costs ?? [];
        const transfer = data?.daily_transfer_costs ?? [];
        const dates = data?.dates ?? [];
        const totalSizeGB = data?.total_size_gb ?? 0;
        const totalDownloadTimeSec = data?.total_download_time_sec ?? 0;

        if (
          !Array.isArray(compute) ||
          !Array.isArray(storage) ||
          !Array.isArray(transfer)
        ) {
          console.error("⚠️ Incomplete simulation data:", { storage, compute, transfer });
          throw new Error("⚠️ Incomplete simulation data");
        }

        // Überprüfe, ob 'Time' im Response vorhanden und gültig ist
        if (typeof data?.Time !== 'undefined') {
          if (isNaN(data.Time) || data.Time < 0) {
            console.warn(`⚠️ Ungültiger Time-Wert erhalten: ${data.Time}`);
            setError('Ungültiger Time-Wert vom Backend erhalten');
            setCard(null);
            setLineChartData({ compute: [], storage: [], transfer: [] });
            setLoading(false);
            return;
          }
        }

        if (storage.length === 0 || compute.length === 0 || transfer.length === 0) {
          console.warn(`⚠️ No data available for date range ${startDate} to ${endDate} in ${currentMode} mode`);
          setCard({
            label: data?.name || "AWS Lakehouse",
            value: summary?.["Total (€)"] || 0,
            change: 0,
            computeData: [],
            storageData: [],
            transferData: [],
            dates: [],
            mode: currentMode,
            totalSizeGB,
            totalDownloadTimeSec,
            summary,
          });
          setLineChartData({ compute: [], storage: [], transfer: [] });
          setLoading(false);
          return;
        }

        const dailyTotals = storage.map(
          (s, i) => (s || 0) + (compute[i] || 0) + (transfer[i] || 0)
        );
        const first = dailyTotals[0];
        const last = dailyTotals[dailyTotals.length - 1];
        const change = first > 0 ? ((last - first) / first) * 100 : 0;

        // Add mode indicator to the label for clarity
        const modeLabel = currentMode === 'predicted' ? ' (Predicted)' : '';
        setCard({
          label: `${data?.name || "AWS Lakehouse"}${modeLabel}`,
          value: summary?.["Total (€)"] || 0,
          change: parseFloat(change.toFixed(1)),
          computeData: compute,
          storageData: storage,
          transferData: transfer,
          dates: dates ?? [],
          mode: currentMode,
          totalSizeGB,
          totalDownloadTimeSec,
          summary,
        });

        setLineChartData({
          compute: compute,
          storage: storage,
          transfer: transfer,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error(
          "❌ useAWSSimulation failed:",
          err?.response?.data || err.message
        );
        setError(err?.message || "Unknown error");
        setCard(null);
        setLineChartData({ compute: [], storage: [], transfer: [] });
        setLoading(false);
      })
      .finally(() => {
        if (inFlightRef.current === cacheKey) {
          inFlightRef.current = null;
        }
      });
  }, [startDate, endDate, mode, equalizerValues]);

  // Automatischer Trigger bei jeder Änderung von equalizerValues, startDate, endDate oder mode
  useEffect(() => {
    if (startDate && endDate) {
      triggerRefresh();
    }
  }, [equalizerValues, startDate, endDate, mode, triggerRefresh]);

  // ✅ FIX 2: Add mode change handler
  useEffect(() => {
    if (prevModeRef.current !== mode && startDate && endDate && !autoRefresh) {
      console.log(`🎯 AWS Mode changed from ${prevModeRef.current} to ${mode}`);
      triggerRefresh();
    }
    prevModeRef.current = mode;
  }, [mode, triggerRefresh, startDate, endDate]);

  return {
    card,
    awsLineChartData,
    loading,
    error,
    triggerRefresh,
    currentMode: currentModeRef.current,
  };
}
