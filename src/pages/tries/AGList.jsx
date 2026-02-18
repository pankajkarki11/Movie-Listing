import { useState, useEffect, useMemo, useCallback } from "react";
import AGTable from "./AGTable2";
import Input from "../Input";

const MovieList2 = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      console.log("Fetched movies:", data.length);
      setAllMovies(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);






  // Column definitions with fixed date filtering
  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 70,
        filter: false,
        sortable: false,
        pinned: "left",
      },
      {
        field: "id",
        headerName: "ID",
        width: 120,
        cellRenderer: (params) => (
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="h-20 w-14 overflow-hidden rounded-md bg-slate-800 shadow-lg">
              <img
                src={params.data.poster}
                alt={params.data.title}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='80' viewBox='0 0 56 80'%3E%3Crect fill='%231e293b' width='56' height='80'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='10' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <span className="text-[9px] text-slate-500 font-mono">
              #{params.data.id}
            </span>
          </div>
        ),
      },
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 200,
        cellRenderer: (params) => (
          <span className="font-medium text-white">
            {params.value || "Untitled"}
          </span>
        ),
      },
      {
        field: "release_date",
        headerName: "Release Date",
        width: 150,
        valueFormatter: (params) => {
          if (!params.value) return "N/A";
          try {
            // Convert Unix timestamp to YYYY-MM-DD
            return new Date(params.value * 1000).toLocaleDateString("en-CA");
          } catch {
            return "Invalid Date";
          }
        },
        filter: "agDateColumnFilter",
        filterParams: {
          comparator: (filterDate, cellValue) => {
            if (!cellValue) return -1;
            
            // Convert Unix timestamp to Date object and normalize
            const cellDate = new Date(cellValue * 1000);
            cellDate.setHours(0, 0, 0, 0);
            
            // Compare dates
            if (cellDate < filterDate) return -1;
            if (cellDate > filterDate) return 1;
            return 0;
          },
          // Enable browser date picker
          browserDatePicker: true,
          // Allow typing in YYYY-MM-DD format
          inRangeFloatingFilterDateFormat: 'YYYY-MM-DD',
        },
        cellClass: "font-mono text-slate-400",
      },
      {
        field: "genres",
        headerName: "Genres",
        width: 250,
        cellRenderer: (params) => {
          const genres = params.value || [];
          return (
            <div className="flex flex-wrap gap-1 py-1">
              {genres.map((genre, i) => (
                <span
                  key={i}
                  className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap"
                >
                  {genre}
                </span>
              ))}
              {genres.length === 0 && (
                <span className="text-slate-600 text-xs">No genres</span>
              )}
            </div>
          );
        },
        valueGetter: (params) => params.data.genres || [],
      },
      {
        field: "overview",
        headerName: "Overview",
        flex: 3,
        minWidth: 300,
        wrapText: true,
        autoHeight: true,
        cellClass: "text-xs text-slate-400 leading-relaxed py-2",
        cellRenderer: (params) => (
          <div className="line-clamp-3">
            {params.value || "No overview available"}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col bg-slate-900 min-h-screen text-slate-100 px-4 pb-8">
      <div className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🎬 Movie Listing
        </h1>
      </div>





      {/* Main content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading movies…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-red-400 text-sm">{error.message}</p>
          <button
            onClick={fetchMovies}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm hover:border-slate-500 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <AGTable
          rowData={allMovies}
          columnDefs={columnDefs}
          enableGlobalSearch={true}
          enableColumnFilter={true}
          enableExport={true}
          exportFileName={`movies_${new Date().toISOString().split("T")[0]}`}
          height={typeof window !== 'undefined' ? window.innerHeight * 0.65 : 600}
          gridOptions={{
            // Remove pagination, use virtualization instead
            rowHeight: 140,
            animateRows: true,
            suppressCellFocus: true,
            getRowId: (params) => String(params.data.id),
            overlayNoRowsTemplate: "No movies found",
            overlayLoadingTemplate: "Loading movies...",
            // Additional virtualization optimizations
            rowBuffer: 20,
            maxConcurrentDatasourceRequests: 1,
            infiniteInitialRowCount: 100,
            maxBlocksInCache: 10,
          }}
        />
      )}
    </div>
  );
};

export default MovieList2;