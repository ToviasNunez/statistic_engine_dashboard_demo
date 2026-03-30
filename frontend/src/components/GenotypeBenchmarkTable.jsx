import { useEffect, useRef, useState } from "react";
import ReactPaginate from "react-paginate";
import { createGrid } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const columnDefs = [
  { field: "genotype_set_id", headerName: "ID", minWidth: 50, width: 80, hide: window.innerWidth < 640 },
  { field: "architecture", headerName: "Arch", minWidth: 100, width: 120 },
  { field: "total_chunks", headerName: "Chunks", minWidth: 80, width: 100, hide: window.innerWidth < 768 },
  { field: "total_size_mb", headerName: "Size (MB)", minWidth: 100, width: 120 },
  { field: "total_download_time_sec", headerName: "Time (s)", minWidth: 100, width: 120, hide: window.innerWidth < 640 },
  { field: "date", headerName: "Created", minWidth: 130, width: 150, hide: window.innerWidth < 768 },
  { field: "source", headerName: "Source", minWidth: 80, width: 100, hide: window.innerWidth < 640 },
  {
    field: "total_cost",
    headerName: "Cost (€)",
    minWidth: 100,
    width: 120,
  },
];

export function GenotypeBenchmarkTable({
  benchmark,
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

  const items = benchmark?.items || [];

  // Init AG Grid
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
    gridApiRef.current.updateGridOptions({ rowData: items || [] });
  }
}, [items]);


  // Search filtering
  useEffect(() => {
  if (gridApiRef.current) {
    gridApiRef.current.updateGridOptions({ quickFilterText: search });
  }
  return () => {
    if (gridApiRef.current) {
      gridApiRef.current.updateGridOptions({ quickFilterText: "" }); // reset on unmount
    }
  };
}, [search]);


  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);  // Update local page only, triggers parent state change
  };

  return (
    <div className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Benchmark Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Performance metrics & analysis</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
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
          placeholder="Search benchmark data..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200 text-sm"
        />
      </div>

            <div
        ref={gridRef}
        id="benchmarkGrid"
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
          activeClassName="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25"
          previousClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          nextClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          disabledClassName={"opacity-40 cursor-not-allowed hover:bg-white hover:shadow-sm"}
        />
      </div>
    </div>
  );
}
