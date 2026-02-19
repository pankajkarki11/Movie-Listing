import { useState, useEffect, useCallback } from "react";
import AGTable from "./AGTable2";

const MovieList = () => {
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
          data={allMovies}
          enableGlobalSearch={true}
          enableColumnFilter={true}
          enableExport={true}
          exportFileName={`movies_${new Date().toISOString().split("T")[0]}`}
          searchPlaceholder="Search across all columns..."
          height={700}
          gridOptions={{
            rowHeight: 140,
            animateRows: true,
            suppressCellFocus: true,
            getRowId: (params) => String(params.data.id),
            rowBuffer: 20,
          }}
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
            cellRendererType="tags"
            cellRendererParams={{ limit: 3 }}
          />

         
          <AGTable.Column
            field="overview"
            header="Overview"
            flex={3}
            minWidth={300}
            wrapText={true}
            autoHeight={true}
            cellRendererType="clampedText"
            cellRendererParams={{ lines: 4 }}
          />
        </AGTable>
      )}
    </div>
  );
};

export default MovieList;