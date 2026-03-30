import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const useGenotypeBenchmarkRange = ({ startDate, endDate, sourceType, autoRefresh = false }) => {
  const [benchmark, setStats] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to convert date to DD/MM/YYYY
  function toDDMMYYYY(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.includes('/')) return date; // already formatted
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const fetchRange = useCallback(() => {
    if (!startDate || !endDate) {
      setStats({ items: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const formattedStart = toDDMMYYYY(startDate);
    const formattedEnd = toDDMMYYYY(endDate);
    const params = { startDate: formattedStart, endDate: formattedEnd };
    if (sourceType) params.sourceType = sourceType;
    console.log('[useGenotypeBenchmarkRange] Request params:', params);
    axios
            .get(`${API_BASE_URL}/api/genotype-benchmark-daily/range`, {
        params,
      })
      .then((res) => {
        console.log("[useGenotypeBenchmarkRange] Backend response:", res.data);
        // Accept both { items, totals } and legacy { items: { items, totals } }
        let items = [];
        let totals = undefined;
        if (Array.isArray(res.data?.items)) {
          items = res.data.items;
          totals = res.data.totals;
        } else if (res.data?.items && Array.isArray(res.data.items.items)) {
          items = res.data.items.items;
          totals = res.data.items.totals;
        }
        // Map backend fields to frontend expected fields
        const mappedItems = items.map((item) => ({
          ...item,
          total_chunks: item.chunks ?? item.total_chunks,
          total_size_mb: item.size_mb ?? item.total_size_mb,
          total_download_time_sec: item.download_time_sec ?? item.total_download_time_sec,
          total_cost: item.simulated_cost_usd ?? item.total_cost,
        }));
        setStats({ items: mappedItems, totals });
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useGenotypeBenchmarkRange failed:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [startDate, endDate, sourceType]);

  // Load data when startDate/endDate changes (no auto-refresh)
  useEffect(() => {
    if (startDate && endDate) {
      fetchRange();
    }
  }, [fetchRange, startDate, endDate, sourceType]);

  return {
    benchmark,
    loading,
    error,
    triggerRefresh: fetchRange,
  };
};
