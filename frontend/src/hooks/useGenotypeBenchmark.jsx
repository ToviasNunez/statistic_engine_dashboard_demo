import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from '../config/api';

export const useGenotypeBenchmark = ({ limit = 100, page = 0, autoRefresh = false }) => {
  const [benchmark, setStats] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  const fetchPage = useCallback(() => {
    setLoading(true);

    axios
      .get(`${API_BASE_URL}/mock/genotype-benchmark-table-mock.json`, {
        params: { page, limit },
      })
      .then((res) => {
        console.log("✅ useGenotypeBenchmark (paginated):", res.data);

        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        if (!Array.isArray(items)) throw new Error("Stats response malformed");

        // Use backend fields directly
        setStats({ items });

        if (typeof res.data.totalCount === "number") {
          setTotalCount(res.data.totalCount);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useGenotypeBenchmark failed:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [page, limit]);

  // Manual trigger
  const triggerRefresh = () => {
    fetchPage();
  };

  // Load data on mount and when page/limit changes (no auto-refresh)
  useEffect(() => {
    fetchPage();
  }, [fetchPage, page, limit]);

  return {
    benchmark,
    loading,
    error,
    totalPages: totalCount !== null ? Math.ceil(totalCount / limit) : null,
    triggerRefresh,
  };
};
