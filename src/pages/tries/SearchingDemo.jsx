import { useState, useEffect, useMemo, useCallback } from "react";
import Table, {
  useTableSearches,
  filterByColumnSearches,
} from "../Table";
import Input from "../Input";



const COLUMN_FILTER_FNS = {
  release_date: (value, term) => {
    if (!value) return false;
    const formatted = new Date(value * 1000).toLocaleDateString("en-CA");
    return formatted.startsWith(term.trim());
  },
};



const ITEM_SIZE    = 130;
const BUFFER_ITEMS = 15;

const getVirtualWindow = (rows, scrollTop) => {
  const viewportH = typeof window !== "undefined" ? window.innerHeight * 0.8 : 800;
  const startIdx  = Math.max(0, Math.floor(scrollTop / ITEM_SIZE) - BUFFER_ITEMS);
  const endIdx    = Math.min(
    rows.length,
    startIdx + Math.ceil(viewportH / ITEM_SIZE) + BUFFER_ITEMS * 2
  );
  return {
    visibleRows: rows.slice(startIdx, endIdx),
    offsetY:     startIdx * ITEM_SIZE,
    totalHeight: rows.length * ITEM_SIZE,
  };
};


const List = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [scrollTop, setScrollTop] = useState(0);
  const [isVisible, setIsVisible] = useState(false);


  const searchState = useTableSearches();

 
  


  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAllMovies(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     fetchMovies(); 
    }, [fetchMovies]);


  const allGenres = useMemo(
    () => [...new Set(allMovies.flatMap((m) => m.genres ?? []))].sort(),
    [allMovies]
  );


  const globalFiltered = useMemo(() => {
    let list = allMovies;

    if (selectedGenre !== "all") {
      list = list.filter((m) => m.genres?.includes(selectedGenre));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.overview?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMovies, selectedGenre, searchTerm]);

  const columnFiltered = useMemo(
    () => filterByColumnSearches(globalFiltered, searchState.searches, COLUMN_FILTER_FNS),
    [globalFiltered, searchState.searches]
  );



  const { visibleRows, offsetY, totalHeight } = useMemo(
    () => getVirtualWindow(columnFiltered, scrollTop),
    [columnFiltered, scrollTop]
  );

  const handleScroll = useCallback((e) => {
    const top = e.target.scrollTop;
    requestAnimationFrame(() => setScrollTop(top));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Reset all filters
  // ─────────────────────────────────────────────────────────────────────────

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedGenre("all");
    searchState.clearSearches();
  };

  const hasAnyFilter =
    searchTerm || selectedGenre !== "all" || searchState.activeCount > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // CSV export (exports columnFiltered — respects both global + column filters)
  // ─────────────────────────────────────────────────────────────────────────

  const exportToCSV = useCallback(() => {
    if (columnFiltered.length === 0) return;

    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = ["ID", "Title", "Release Date", "Genres", "Overview", "Poster URL"];
    const rows = columnFiltered.map((m) =>
      [
        m.id,
        escape(m.title),
        `"${new Date(m.release_date * 1000).toLocaleDateString("en-CA")}"`,
        escape((m.genres ?? []).join("; ")),
        escape(m.overview),
        escape(m.poster),
      ].join(",")
    );

    const BOM  = "\uFEFF";
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href:     url,
      download: `movies_${new Date().toISOString().split("T")[0]}.csv`,
      style:    "visibility:hidden",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [columnFiltered]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-slate-900 min-h-screen text-slate-100 px-4 pb-8">

    
      <div className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🎬 Movie Listing
        </h1>
       
      </div>

      {/* ── Global filter bar ──────────────────────────────────────────── */}
      <section className="mb-6 grid gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:grid-cols-[1fr_200px_auto]">
        <Input
          label="Global Search"
          type="text"
          placeholder="Search title or overview…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Genre
          </span>
          <select
            className="h-8 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none ring-emerald-500/50 transition focus:ring-2 focus:border-emerald-500"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="all">All Genres</option>
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasAnyFilter}
            className="h-8 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            disabled={columnFiltered.length === 0}
            className="h-8 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 whitespace-nowrap"
          >
            📥 Export CSV ({columnFiltered.length})
          </button>

          <button
        className="bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-600 px-4 py-2 rounded-lg"
        
        onClick={()=>{setIsVisible(!isVisible)
            clearAllFilters();
        }}
        >{isVisible ? "Close Search" : "Search Table"}</button>
        </div>
      </section>

   
      <p className="mb-3 text-xs text-slate-500 font-mono px-1">
        Showing{" "}
        <span className="text-emerald-400 font-semibold">{columnFiltered.length}</span>
        {" "}of{" "}
        <span className="text-slate-300">{allMovies.length}</span> movies
        {searchState.activeCount > 0 && (
          <span className="text-amber-400 ml-2">
            · {searchState.activeCount} column filter{searchState.activeCount > 1 ? "s" : ""} active
          </span>
        )}
      </p>

      {/* ── Main content ───────────────────────────────────────────────── */}
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
     
        <div
          className="overflow-auto rounded-xl"
          style={{ height: "80vh", overscrollBehavior: "contain" }}
          onScroll={handleScroll}
        >
      
          <div style={{ height: totalHeight, position: "relative", minHeight: "100%" }}>

           
            <div style={{ transform: `translateY(${offsetY}px)`, willChange: "transform" }}>

              <Table searchState={searchState}>
                <Table.Header>
                  <Table.HeaderCell className="hidden sm:table-cell" width={60}>
                    #
                  </Table.HeaderCell>

                  <Table.HeaderCell className="hidden sm:table-cell" width={100}
                  searchable={isVisible}
  dataKey={isVisible ? "id" : undefined}
                  >
                    ID
                  </Table.HeaderCell>

                  <Table.HeaderCell  searchable={isVisible}
  dataKey={isVisible ? "title" : undefined}>
                    Title
                  </Table.HeaderCell>

                  <Table.HeaderCell
                    className="hidden md:table-cell"
                     searchable={isVisible}
  dataKey={isVisible ? "release_date" : undefined}
                    width={160}
                  >
                    Release Date
                  </Table.HeaderCell>

                  <Table.HeaderCell
                    className="hidden lg:table-cell"
                    searchable={isVisible}
  dataKey={isVisible ? "genres" : undefined}
                    width={200}
                  >
                    Genres
                  </Table.HeaderCell>

                  <Table.HeaderCell  searchable={isVisible}
  dataKey={isVisible ? "overview" : undefined}>
                    Overview
                  </Table.HeaderCell>
                </Table.Header>

                <Table.Body
                  isEmpty={columnFiltered.length === 0}
                  activeFilterCount={searchState.activeCount}
                >
                  {visibleRows.map((movie) => {
                 
                    const index = columnFiltered.findIndex((m) => m.id === movie.id);

                    return (
                      <Table.Row key={movie.id}>
                        {/* # */}
                        <Table.Cell className="hidden sm:table-cell text-slate-500 text-xs tabular-nums">
                          {index + 1}
                        </Table.Cell>

                        {/* ID + poster */}
                        <Table.Cell className="hidden sm:table-cell">
                          <div className="flex flex-col items-start gap-1.5">
                            <div className="h-16 w-12 overflow-hidden rounded-md bg-slate-800 flex-shrink-0">
                              <img
                                src={movie.poster}
                                alt={`${movie.title} poster`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {movie.id}
                            </span>
                          </div>
                        </Table.Cell>

                        {/* Title (+ poster on mobile) */}
                        <Table.Cell>
                          <div className="flex items-start gap-3">
                            <div className="sm:hidden h-16 w-12 overflow-hidden rounded-md bg-slate-800 flex-shrink-0">
                              <img
                                src={movie.poster}
                                alt={`${movie.title} poster`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="text-sm font-medium text-white leading-snug">
                              {movie.title}
                            </span>
                          </div>
                        </Table.Cell>

                        {/* Release date */}
                        <Table.Cell className="hidden md:table-cell text-xs font-mono text-slate-400">
                          {new Date(movie.release_date * 1000).toLocaleDateString("en-CA")}
                        </Table.Cell>

                        {/* Genres */}
                        <Table.Cell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(movie.genres ?? []).map((genre, i) => (
                              <span
                                key={i}
                                className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[11px]"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </Table.Cell>

                        {/* Overview */}
                        <Table.Cell className="text-xs text-slate-400 leading-relaxed">
                          {movie.overview}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;