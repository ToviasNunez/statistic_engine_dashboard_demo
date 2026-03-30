import ReactPaginate from "react-paginate";
import { useEffect, useRef, useState } from "react";
import { createGrid } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const columnDefs = [
  { field: "genotype_set_id", headerName: "ID", minWidth: 50, width: 80, hide: window.innerWidth < 640 },
  { field: "entries_count", headerName: "Rows", minWidth: 80, width: 100 },
  { field: "columns_count", headerName: "Cols", minWidth: 80, width: 100, hide: window.innerWidth < 768 },
  { field: "file_size_kb", headerName: "Size (KB)", minWidth: 100, width: 120 },
  { field: "download_time_sec", headerName: "Time (s)", minWidth: 100, width: 120, hide: window.innerWidth < 640 },
  { field: "created_at", headerName: "Created", minWidth: 130, width: 150, hide: window.innerWidth < 768 },
  { field: "source", headerName: "Source", minWidth: 80, width: 100 },
];

export function GenotypeStatsTable({
  stats,
  loading = false,
  currentPage,
  totalPages,
  goToPage,
  pageSize,
  setCurrentPage,
}) {
  const gridRef = useRef(null);
  const gridApiRef = useRef(null);
  const [search, setSearch] = useState("");

  // Fix: stats is already an array, not an object with items property
  const items = Array.isArray(stats) ? stats : [];
  
  console.log("🔍 GenotypeStatsTable - stats received:", stats);
  console.log("🔍 GenotypeStatsTable - items length:", items.length);
  console.log("🔍 GenotypeStatsTable - first item:", items[0]);

  // Initialize AG Grid
  useEffect(() => {
    if (!gridRef.current || gridApiRef.current) return;

    const gridApi = createGrid(gridRef.current, {
      columnDefs,
      rowData: [],
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
      },
      getRowStyle: (params) => ({
        backgroundColor: params.node.rowIndex % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
        color: "#1E293B",
        borderBottom: "1px solid #E2E8F0",
        fontSize: "14px",
        fontWeight: "500",
      }),
      onFirstDataRendered: (params) => params.api.sizeColumnsToFit(),
    });

    gridApiRef.current = gridApi;
  }, []);

  useEffect(() => {
    if (gridApiRef.current) {
      console.log("🔍 Setting grid data with", items.length, "items");
      gridApiRef.current.updateGridOptions({ rowData: items || [] });
      console.log("🔍 Grid row count after update:", gridApiRef.current.getDisplayedRowCount());
    }
  }, [items]);

  // Search filtering
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.updateGridOptions({ quickFilterText: search });
    }
    return () => {
      if (gridApiRef.current) {
        gridApiRef.current.updateGridOptions({ quickFilterText: "" }); // Reset on unmount
      }
    };
  }, [search]);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected); // Update local page only, triggers parent state change
  };

  return (
    <div className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Genotype Statistics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Advanced genetic data analytics</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200">
          {items.length} records
        </div>
      </div>

      {loading && <div className="text-center text-sm mb-2">⏳ Loading...</div>}
      {!loading && items.length === 0 && (
        <div className="text-center text-sm mb-2">No data found.</div>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-sm bg-gray-50 hover:bg-white shadow-sm"
        />
      </div>

      <div
        ref={gridRef}
        id="myGrid"
        className="ag-theme-alpine"
        style={{ height: window.innerWidth < 640 ? 400 : 500, width: "100%" }}
      ></div>

      <div className="flex justify-center mt-4 overflow-x-auto">
        <ReactPaginate
          previousLabel={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </div>
          }
          nextLabel={
            <div className="flex items-center gap-2">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          }
          breakLabel={"..."}
          forcePage={Math.max(0, Math.min(currentPage || 0, Math.max(0, (totalPages || 1) - 1)))}
          pageCount={totalPages || 1}
          onPageChange={handlePageClick}
          containerClassName={"flex gap-2 text-sm font-medium"}
          pageClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md min-w-[44px] text-center"}
          activeClassName="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/25"
          previousClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          nextClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          disabledClassName={"opacity-40 cursor-not-allowed hover:bg-white hover:shadow-sm"}
        />
      </div>

      {/* Debug section - remove in production */}
      {items.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs sm:text-sm text-gray-600">
            🔍 Debug: Show first 3 records (click to expand)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 w-full">
            {JSON.stringify(items.slice(0, 3), null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
