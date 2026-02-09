import { useState, useEffect, useMemo, useCallback } from "react";
import Table from "./Table";
import Input from "./Input";
import useMovieFilters from "../utils/useMovies";

const List = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [error, setError] = useState(null);

 
  const { filters, updateFilter, clearFilters, filteredMovies, allGenres } =
    useMovieFilters(allMovies);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array");
      }

      setAllMovies(data);
    } catch (error) {
      setError(error);
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const exportToCSV = useCallback(() => {
    if (filteredMovies.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Release Date",
      "Genres",
      "Overview",
      "Poster URL",
    ];

    // Helper to escape CSV fields
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return "";
      const stringField = String(field);

      if (
        stringField.includes(",") ||
        stringField.includes('"') ||
        stringField.includes("\n") ||
        stringField.includes("\r")
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const csvRows = filteredMovies.map((movie) => {
      let releaseDate = "";
      if (movie.release_date) {
        try {
          releaseDate = new Date(movie.release_date * 1000).toLocaleDateString("en-CA");
        } catch (e) {
          releaseDate = "Invalid Date";
        }
      }

      const genres = movie.genres ? movie.genres.join("; ") : "";

      return [
        movie.id || "",
        escapeCSV(movie.title),
        escapeCSV(releaseDate),
        escapeCSV(genres),
        escapeCSV(movie.overview),
        escapeCSV(movie.poster),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `movies_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();

  
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, [filteredMovies]);

  // Virtual scrolling configuration
  const itemSize = 130;
  const bufferItems = 15;

  const totalHeight = useMemo(() => {
    return Math.max(filteredMovies.length * itemSize, 100); 
  }, [filteredMovies.length]);

  const { visibleMovies, offsetY, startIndex } = useMemo(() => {
    const containerHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.8 : 800;

    const startIdx = Math.max(0, Math.floor(scrollTop / itemSize) - bufferItems);
    const visibleCount = Math.ceil(containerHeight / itemSize);
    const endIndex = Math.min(
      filteredMovies.length,
      startIdx + visibleCount + bufferItems * 2
    );

    return {
      visibleMovies: filteredMovies.slice(startIdx, endIndex),
      offsetY: startIdx * itemSize,
      startIndex: startIdx,
    };
  }, [filteredMovies, scrollTop, bufferItems]);

  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  return (
    <div className="flex-col justify-center items-center bg-gray-100 min-h-screen">
      <div className="flex text-3xl justify-center mb-4 pt-4">Movie Listing</div>

      <section className="mb-3 grid gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
     
        <Input
          label="Search"
          type="text"
          placeholder="Search title or overview"
          value={filters.searchTerm}
          onChange={(e) => updateFilter("searchTerm", e.target.value)}
        />

        <Input
          label="Search By Title"
          type="text"
          placeholder="Search title..."
          value={filters.searchTitle}
          onChange={(e) => updateFilter("searchTitle", e.target.value)}
        />

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Genre
          </span>
          <select
            className="h-8 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
            value={filters.selectedGenre}
            onChange={(e) => updateFilter("selectedGenre", e.target.value)}
          >
            <option value="all">All Genres</option>
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Release Date"
          type="text"
          placeholder="YYYY-MM-DD"
          helperText="Format: YYYY-MM-DD or YYYY-MM or YYYY"
          value={filters.searchReleaseDate}
          onChange={(e) => updateFilter("searchReleaseDate", e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
          {isVisible && (
            <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
              <Input
                label="Search By ID"
                type="number"
                placeholder="Enter movie ID..."
                value={filters.searchId}
                onChange={(e) => updateFilter("searchId", e.target.value)}
              />

              <Input
                label="Search By Genres"
                type="text"
                placeholder="Search genres..."
                value={filters.searchGenres}
                onChange={(e) => updateFilter("searchGenres", e.target.value)}
              />

              <Input
                label="Search By Overview"
                type="text"
                placeholder="Search overview..." 
                value={filters.searchOverview}
                onChange={(e) => updateFilter("searchOverview", e.target.value)}
              />
            </div>
          )}

          <div className="ml-auto m-2 flex items-center gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-700 px-2 py-2 text-sm text-slate-200 transition hover:border-emerald-500"
              aria-label="Reset all filters"
            >
              Reset filters
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-500 px-2 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              onClick={exportToCSV}
              disabled={filteredMovies.length === 0}
              aria-label={`Export ${filteredMovies.length} movies to CSV`}
            >
              📥 Export to CSV ({filteredMovies.length})
            </button>
            <button
              type="button"
              className="rounded-xl border border-emerald-900 px-2 py-2 text-sm text-slate-200 transition hover:border-emerald-500"
              onClick={() => setIsVisible(!isVisible)}
              aria-label={isVisible ? "Hide advanced search" : "Show advanced search"}
            >
              {isVisible ? "Hide" : "Show"} Advanced Search
            </button>
          </div>
        </div>
      </section>

      <p className="flex items-center justify-center mb-2 text-gray-600">
        Showing {filteredMovies.length} out of {allMovies.length} movies
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-xl text-slate-600">Loading movies...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="flex flex-col items-center gap-4 max-w-md p-6 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xl text-red-600 font-semibold">Error Loading Movies</p>
            <p className="text-sm text-red-500">{error.message}</p>
            <button
              onClick={fetchMovies}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-xl text-slate-600">No movies found matching your filters</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div
          className="overflow-auto h-[80vh]"
          onScroll={handleScroll}
          style={{
            overscrollBehavior: "contain",
          }}
        >
          <div
            style={{
              height: `${totalHeight}px`,
              position: "relative",
              minHeight: "100%",
            }}
          >
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                willChange: "transform",
              }}
            >
              <Table>
                <Table.Header>
                  <Table.HeaderCell className="hidden sm:table-cell">
                    Index
                  </Table.HeaderCell>
                  <Table.HeaderCell className="hidden sm:table-cell">
                    ID
                  </Table.HeaderCell>
                  <Table.HeaderCell>Title</Table.HeaderCell>
                  <Table.HeaderCell className="hidden md:table-cell">
                    Release Date
                  </Table.HeaderCell>
                  <Table.HeaderCell className="hidden lg:table-cell">
                    Genre
                  </Table.HeaderCell>
                  <Table.HeaderCell>Overview</Table.HeaderCell>
                </Table.Header>

                <Table.Body>
                  {visibleMovies.map((movie, idx) => {
                    const actualIndex = startIndex + idx;
                    
                    return (
                      <Table.Row key={movie.id}>
                        <Table.Cell className="hidden sm:table-cell">
                          {actualIndex + 1}
                        </Table.Cell>

                        <Table.Cell className="hidden sm:table-cell">
                          <div className="flex h-20 w-20">
                            {movie.poster ? (
                              <img
                                src={movie.poster}
                                alt={`${movie.title || 'Movie'} poster`}
                                loading="lazy"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/80x120?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-slate-200 text-slate-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          ID: {movie.id}
                        </Table.Cell>

                        <Table.Cell className="text-lg">
                          {movie.poster && (
                            <img
                              className="sm:hidden h-20 w-20"
                              src={movie.poster}
                              alt={`${movie.title || 'Movie'} poster`}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/80x120?text=No+Image';
                              }}
                            />
                          )}
                          {movie.title || "Untitled"}
                        </Table.Cell>

                        <Table.Cell className="hidden md:table-cell">
                          {movie.release_date
                            ? new Date(movie.release_date * 1000).toLocaleDateString("en-CA")
                            : "N/A"}
                        </Table.Cell>

                        <Table.Cell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {movie.genres && movie.genres.length > 0 ? (
                              movie.genres.map((genre) => (
                                <div
                                  key={genre}
                                  className="bg-slate-300 text-gray-800 px-2 py-1 rounded-full text-xs"
                                >
                                  {genre}
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">No genres</span>
                            )}
                          </div>
                        </Table.Cell>

                        <Table.Cell>{movie.overview || "No overview available"}</Table.Cell>
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