import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Table, { useTableSearches, filterByColumnSearches, useDebounce } from "./TableV2";
import Input from "./Input";

// ─── Data processing ───────────────────────────────────────────────────────
const processMovies = (raw) =>
  raw.map((m) => {
    const d = m.release_date ? new Date(m.release_date * 1000) : null;
    return {
      ...m,
      releaseDateStr: d ? d.toLocaleDateString("en-CA") : "",
      genresStr: (m.genres ?? []).join(", "),
    };
  });

const COLUMN_FILTER_FNS = {
  releaseDateStr: (value, term) => (value ? value.startsWith(term.trim()) : false),
};

// ─── Virtualisation ────────────────────────────────────────────────────────
const ITEM_SIZE = 130;
const BUFFER_ITEMS = 15;

const getVirtualWindow = (rows, scrollTop, viewportH) => {
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_SIZE) - BUFFER_ITEMS);
  const endIdx = Math.min(
    rows.length,
    startIdx + Math.ceil(viewportH / ITEM_SIZE) + BUFFER_ITEMS * 2,
  );
  return {
    visibleRows: rows.slice(startIdx, endIdx),
    startIdx,
    offsetY: startIdx * ITEM_SIZE,
    totalHeight: rows.length * ITEM_SIZE,
  };
};

// ─── Cell renderers ────────────────────────────────────────────────────────
const PosterThumb = ({ movie }) => (
  <div className="flex flex-col items-start gap-1.5">
    <div className="h-16 w-12 overflow-hidden rounded-md bg-slate-800 flex-shrink-0">
      <img src={movie.poster} alt={`${movie.title} poster`} loading="lazy"
        className="h-full w-full object-cover" />
    </div>
    <span className="text-[10px] text-slate-500 font-mono">{movie.id}</span>
  </div>
);

const TitleCell = ({ movie }) => (
  <div className="flex items-start gap-3">
    <div className="sm:hidden h-16 w-12 overflow-hidden rounded-md bg-slate-800 flex-shrink-0">
      <img src={movie.poster} alt={`${movie.title} poster`} loading="lazy"
        className="h-full w-full object-cover" />
    </div>
    <span className="text-sm font-medium text-white leading-snug">{movie.title}</span>
  </div>
);

const GenreTags = ({ genres }) => (
  <div className="flex flex-wrap gap-1">
    {(genres ?? []).map((genre, i) => (
      <span key={i}
        className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[11px]">
        {genre}
      </span>
    ))}
  </div>
);

// ─── Column definitions ────────────────────────────────────────────────────
const COLUMNS = [
  {
    header: "#",
    width: 50,
    searchable: false,
    className: "hidden sm:table-cell",
    cellClassName: "text-slate-500 text-xs tabular-nums",
    render: (_row, absIdx) => absIdx + 1,
  },
  {
    header: "ID",
    dataKey: "id",
    width: 100,
    className: "hidden sm:table-cell",
    render: (movie) => <PosterThumb movie={movie} />,
  },
  {
    header: "Title",
    dataKey: "title",
    render: (movie) => <TitleCell movie={movie} />,
  },
  {
    header: "Release Date",
    dataKey: "releaseDateStr",
    searchType: "date",
    width: 170,
    className: "hidden md:table-cell",
    cellClassName: "text-xs font-mono text-slate-400",
  },
  {
    header: "Genres",
    dataKey: "genres",
    width: 200,
    className: "hidden lg:table-cell",
    render: (movie) => <GenreTags genres={movie.genres} />,
  },
  {
    header: "Overview",
    dataKey: "overview",
    cellClassName: "text-xs text-slate-400 leading-relaxed",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────
const MovieListV2 = () => {
  const [allMovies, setAllMovies]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [scrollTop, setScrollTop]         = useState(0);
  const [viewportH, setViewportH]         = useState(800);
  const [showSearch, setShowSearch]       = useState(false);

  const scrollRef = useRef(null);
  const rafRef    = useRef(null);
 
  const prevFilteredLengthRef = useRef(null);

  const searchState = useTableSearches();


  useEffect(() => {
    const measure = () =>
      setViewportH(scrollRef.current?.clientHeight ?? window.innerHeight * 0.8);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Fetch ──
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setAllMovies(processMovies(await res.json()));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  // ── Debounce global search — input stays instant, filter fires after pause ──
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ── Genre list ──
  const allGenres = useMemo(
    () => [...new Set(allMovies.flatMap((m) => m.genres ?? []))].sort(),
    [allMovies],
  );

  // ── Filters ──
  const globalFiltered = useMemo(() => {
    let list = allMovies;
    if (selectedGenre !== "all")
      list = list.filter((m) => m.genres?.includes(selectedGenre));
    if (debouncedSearchTerm.trim()) {
      const q = debouncedSearchTerm.toLowerCase();
      list = list.filter(
        (m) => m.title?.toLowerCase().includes(q) || m.overview?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allMovies, selectedGenre, debouncedSearchTerm]);

  const columnFiltered = useMemo(
    () => filterByColumnSearches(globalFiltered, searchState.searches, COLUMN_FILTER_FNS),
    [globalFiltered, searchState.searches],
  );
  useEffect(() => {
    const newLength = columnFiltered.length;
    const prevLength = prevFilteredLengthRef.current;
    if (prevLength === null) {
      prevFilteredLengthRef.current = newLength;
      return;
    }

    
    if (newLength !== prevLength) {
      prevFilteredLengthRef.current = newLength;

   
      setScrollTop(0);


      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [columnFiltered]);

  // ── Virtual window ──
  const { visibleRows, startIdx, offsetY, totalHeight } = useMemo(
    () => getVirtualWindow(columnFiltered, scrollTop, viewportH),
    [columnFiltered, scrollTop, viewportH],
  );

  // ── Scroll handler ──
  const handleScroll = useCallback((e) => {
    const top = e.target.scrollTop;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(top);
      rafRef.current = null;
    });
  }, []);


  const { clearSearches } = searchState;
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGenre("all");
    clearSearches();
  }, [clearSearches]);

  const hasAnyFilter = searchTerm || selectedGenre !== "all" || searchState.activeCount > 0;

  const exportToCSV = useCallback(() => {
    if (!columnFiltered.length) return;
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const headers = ["ID", "Title", "Release Date", "Genres", "Overview", "Poster URL"];
    const rows = columnFiltered.map((m) =>
      [m.id, esc(m.title), `"${m.releaseDateStr}"`, esc(m.genresStr), esc(m.overview), esc(m.poster)].join(","),
    );
    const blob = new Blob(["\uFEFF" + [headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `movies_${new Date().toISOString().split("T")[0]}.csv`,
      style: "visibility:hidden",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [columnFiltered]);

  // ───────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-slate-900 min-h-screen text-slate-100 px-4 pb-8">

   
      <div className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">🎬 Movie Listing</h1>
      </div>

   
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
            {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button type="button" onClick={clearAllFilters} disabled={!hasAnyFilter}
            className="h-8 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm
              text-slate-300 transition hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed">
            Reset all
          </button>
          <button type="button" onClick={exportToCSV} disabled={!columnFiltered.length}
            className="h-8 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950
              transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700
              disabled:text-slate-400 whitespace-nowrap">
            📥 Export CSV ({columnFiltered.length})
          </button>
        </div>
      </section>

  
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-mono">
          Showing{" "}
          <span className="text-emerald-400 font-semibold">{columnFiltered.length}</span>{" "}
          of <span className="text-slate-300">{allMovies.length}</span> movies
          {searchState.activeCount > 0 && (
            <span className="text-amber-400 ml-2">
              · {searchState.activeCount} column filter{searchState.activeCount > 1 ? "s" : ""} active
            </span>
          )}
        </p>

        <button type="button" onClick={() => setShowSearch((v) => !v)} aria-pressed={showSearch}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-lg border text-xs font-medium
            transition-all duration-150
            ${showSearch
              ? "border-emerald-600/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          {showSearch ? "Hide search" : "Show search"}
          {!showSearch && searchState.activeCount > 0 && (
            <span className="ml-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full leading-tight">
              {searchState.activeCount}
            </span>
          )}
        </button>
      </div>

    
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading movies…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-red-400 text-sm">{error.message}</p>
          <button onClick={fetchMovies}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm hover:border-slate-500 transition">
            Retry
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-auto rounded-xl"
          style={{ height: "80vh", overscrollBehavior: "contain" }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: "relative", minHeight: "100%" }}>
            <div style={{ transform: `translateY(${offsetY}px)`, willChange: "transform" }}>
              <Table
                columns={COLUMNS}
                rows={visibleRows}
                startIndex={startIdx}
                searches={searchState.searches}
                onSearch={searchState.setSearch}
                showSearch={showSearch}
                isEmpty={columnFiltered.length === 0}
                activeFilterCount={searchState.activeCount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieListV2;