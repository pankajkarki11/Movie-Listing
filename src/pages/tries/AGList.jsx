// MovieList2.jsx - FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from "react";
import AGTable from "./AGTable2";

const MovieList2 = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json"
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

 
  const gridOptions = useMemo(() => ({
    rowHeight: 140,
    animateRows: false,
    suppressCellFocus: true,
  
    rowBuffer: 5, 
   
    getRowId: (params) => String(params.data.id),
  
  }), []);

  return (
    <div className="flex flex-col bg-slate-900 min-h-screen text-slate-100 px-4 pb-8">
      <div className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🎬 Movie Database
        </h1>
        <div className="text-sm text-slate-400">
          {allMovies.length > 0 && `${allMovies.length.toLocaleString()} movies`}
        </div>
      </div>

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
          data={allMovies}
          enableGlobalSearch={true}
          enableColumnFilter={true}
          enableExport={true}
          exportFileName={`movies_${new Date().toISOString().split("T")[0]}`}
          searchPlaceholder="Search across all columns..."
          height={700}
          gridOptions={gridOptions}
        >
          <AGTable.Column
            headerName="#"
            cellRendererType="rowNumber"
            width={70}
            filter={false}
            sortable={false}
            pinned="left"
          />

          <AGTable.Column
            field="poster"
            header="Poster"
            width={120}
            filter={false}
            sortable={false}
          />

          <AGTable.Column
            field="id"
            header="ID"
            width={80}
          />

          <AGTable.Column
            field="title"
            header="Title"
            flex={2}
            minWidth={200}
            cellRendererType="text"
          />

          <AGTable.Column
            field="release_date"
            header="Release Date"
            dateFormat="unix"
            width={150}
          />

          <AGTable.Column
            field="genres"
            header="Genres"
            width={250}
            cellRendererParams={{ limit: 3 }}
          />

          <AGTable.Column
            field="overview"
            header="Overview"
            flex={3}
            minWidth={300}
           
            cellRendererType="clampedText"
          />
        </AGTable>
      )}
    </div>
  );
};

export default MovieList2;