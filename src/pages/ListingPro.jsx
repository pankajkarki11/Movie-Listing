import { useEffect, useMemo, useState, useDeferredValue } from "react";

const DATA_URL =
  "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json";

const formatDate = (unixSeconds) => {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString("en-CA");
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
};

const ListingPro = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [year, setYear] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(DATA_URL);
        const data = await response.json();
        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load movies.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const genres = useMemo(() => {
    const set = new Set();
    movies.forEach((movie) => {
      (movie.genres || []).forEach((g) => set.add(g));
    });
    return ["all", ...Array.from(set)];
  }, [movies]);

  const filtered = useMemo(() => {
    let list = [...movies];

    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.overview?.toLowerCase().includes(q),
      );
    }

    if (genre !== "all") {
      list = list.filter((m) => m.genres?.includes(genre));
    }

    if (year.trim()) {
      list = list.filter((m) => {
        const value = formatDate(m.release_date);
        return value.startsWith(year.trim());
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "release_date") {
        return (a.release_date - b.release_date) * dir;
      }
      if (sortBy === "id") {
        return (a.id - b.id) * dir;
      }
      const aText = (a.title || "").toLowerCase();
      const bText = (b.title || "").toLowerCase();
      return aText.localeCompare(bText) * dir;
    });

    return list;
  }, [movies, deferredSearch, genre, year, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paged = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const exportToCSV = () => {
    if (!filtered.length) return;

    const headers = ["ID", "Title", "Release Date", "Genres", "Overview", "Poster URL"];
    const rows = filtered.map((movie) => {
      const row = [
        movie.id,
        csvEscape(movie.title),
        csvEscape(formatDate(movie.release_date)),
        csvEscape((movie.genres || []).join("; ")),
        csvEscape(movie.overview),
        csvEscape(movie.poster),
      ];
      return row.join(",");
    });

    const content = [headers.join(","), ...rows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `movies_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setGenre("all");
    setYear("");
    setSortBy("title");
    setSortDir("asc");
    setPage(1);
    setPageSize(20);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Curated movie catalog
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Movie Listing Pro
          </h1>
          <p className="max-w-2xl text-slate-400">
            Fast search, focused filters, and a polished table layout for movie discovery.
          </p>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Total movies</p>
            <p className="mt-2 text-3xl font-semibold text-white">{movies.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Results</p>
            <p className="mt-2 text-3xl font-semibold text-white">{filtered.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Visible</p>
            <p className="mt-2 text-3xl font-semibold text-white">{paged.length}</p>
          </div>
        </section>

        <section className="mb-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Search
            </span>
            <input
              className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
              placeholder="Search title or overview"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Genre
            </span>
            <select
              className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
              }}
            >
              {genres.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All genres" : item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Release year
            </span>
            <input
              className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
              placeholder="YYYY"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sort
            </span>
            <div className="flex gap-2">
              <select
                className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="release_date">Release date</option>
                <option value="id">ID</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 transition hover:border-emerald-500"
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-500"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              disabled={!filtered.length}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              Export CSV
            </button>
            <div className="ml-auto text-xs text-slate-400">
              Page {safePage} of {totalPages}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Results</h2>
              <p className="text-sm text-slate-400">Showing {paged.length} of {filtered.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-100"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 40, 60].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center text-slate-300">
              Loading movies...
            </div>
          ) : error ? (
            <div className="flex h-80 items-center justify-center text-red-400">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 text-left">Poster</th>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Release</th>
                    <th className="px-6 py-3 text-left">Genres</th>
                    <th className="px-6 py-3 text-left">Overview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paged.map((movie) => (
                    <tr key={movie.id} className="hover:bg-slate-900/70">
                      <td className="px-6 py-4">
                        <img
                          className="h-16 w-12 rounded-lg object-cover shadow-lg"
                          src={movie.poster}
                          alt={`${movie.title} poster`}
                          loading="lazy"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">{movie.title}</div>
                        <div className="text-xs text-slate-500">ID: {movie.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {formatDate(movie.release_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(movie.genres || []).slice(0, 4).map((g) => (
                            <span
                              key={g}
                              className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200"
                            >
                              {g}
                            </span>
                          ))}
                          {(movie.genres || []).length > 4 && (
                            <span className="text-xs text-slate-500">+ more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <p className="line-clamp-3 max-w-md text-xs leading-relaxed">
                          {movie.overview}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!paged.length && (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  No movies match these filters.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
            <p className="text-xs text-slate-400">
              Showing {pageStart + 1}-{Math.min(pageEnd, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ListingPro;
