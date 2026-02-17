import { useState, useEffect, useMemo, useCallback } from "react";
import Table from "./AGgrid";
import Input from "./Input";

const MovieList = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [activeFilters, setActiveFilters] = useState({});

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

  // Apply global filters
  const filteredMovies = useMemo(() => {
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

  // Define columns - simple array with field names
  const columns = useMemo(() => [
    {
      header: "#",
      field: null, // No field = not searchable
      width: 60,
      cellClass: "hidden sm:flex",
      headerClass: "hidden sm:flex",
      cellRenderer: (params) => {
        if (!params.data) return "";
        const index = filteredMovies.findIndex((m) => m.id === params.data.id) + 1;
        return <span className="text-slate-500 text-xs tabular-nums">{index}</span>;
      }
    },
    {
      header: "ID",
      field: "id",
      width: 100,
      cellClass: "hidden sm:flex",
      headerClass: "hidden sm:flex",
      cellRenderer: (params) => {
        if (!params.data) return "";
        return (
          <div className="flex flex-col items-start gap-1.5 py-2">
            <div className="h-16 w-12 overflow-hidden rounded-md bg-slate-800">
              <img
                src={params.data.poster}
                alt={params.data.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {params.data.id}
            </span>
          </div>
        );
      }
    },
    {
      header: "Title",
      field: "title",
      flex: 2,
      minWidth: 200,
      cellRenderer: (params) => {
        if (!params.data) return "";
        return (
          <div className="flex items-start gap-3 py-2">
            <div className="sm:hidden h-16 w-12 overflow-hidden rounded-md bg-slate-800">
              <img
                src={params.data.poster}
                alt={params.data.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-white leading-snug">
              {params.data.title}
            </span>
          </div>
        );
      }
    },
    {
      header: "Release Date",
      field: "release_date",
      width: 160,
      cellClass: "hidden md:flex",
      headerClass: "hidden md:flex",
      valueFormatter: (params) => {
        if (!params.value) return "";
        return new Date(params.value * 1000).toLocaleDateString("en-CA");
      }
    },
    {
      header: "Genres",
      field: "genres",
      width: 200,
      cellClass: "hidden lg:flex",
      headerClass: "hidden lg:flex",
      cellRenderer: (params) => {
        if (!params.value) return "";
        return (
          <div className="flex flex-wrap gap-1 py-2">
            {params.value.map((genre, i) => (
              <span
                key={i}
                className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[11px]"
              >
                {genre}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: "Overview",
      field: "overview",
      flex: 3,
      minWidth: 300,
      wrapText: true,
      autoHeight: true,
      cellClass: "text-xs text-slate-400 leading-relaxed"
    }
  ], [filteredMovies]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedGenre("all");
  };

  const hasAnyFilter = searchTerm || selectedGenre !== "all" || Object.keys(activeFilters).length > 0;

  const exportToCSV = useCallback(() => {
    if (filteredMovies.length === 0) return;

    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = ["ID", "Title", "Release Date", "Genres", "Overview", "Poster URL"];
    const rows = filteredMovies.map((m) =>
      [
        m.id,
        escape(m.title),
        `"${new Date(m.release_date * 1000).toLocaleDateString("en-CA")}"`,
        escape((m.genres ?? []).join("; ")),
        escape(m.overview),
        escape(m.poster),
      ].join(",")
    );

    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
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
  }, [filteredMovies]);

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
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
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
            disabled={filteredMovies.length === 0}
            className="h-8 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 whitespace-nowrap"
          >
            📥 Export CSV ({filteredMovies.length})
          </button>
        </div>
      </section>

      <p className="mb-3 text-xs text-slate-500 font-mono px-1">
        Showing{" "}
        <span className="text-emerald-400 font-semibold">{filteredMovies.length}</span> of{" "}
        <span className="text-slate-300">{allMovies.length}</span> movies
        {Object.keys(activeFilters).length > 0 && (
          <span className="text-amber-400 ml-2">
            · {Object.keys(activeFilters).length} column filter
            {Object.keys(activeFilters).length > 1 ? "s" : ""} active
          </span>
        )}
      </p>

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
        <div className="h-[70vh] w-full">
          <Table
            data={filteredMovies}
            columns={columns}
            quickFilter={searchTerm}
            onFilterChange={setActiveFilters}
            disabledColumns={[0]} // Disable search for first column (index)
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default MovieList;