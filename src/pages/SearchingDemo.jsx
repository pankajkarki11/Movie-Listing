import { useState, useEffect, useMemo, useCallback } from "react";
import Table from "./Table";
import Input from "./Input";

const List = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchOverview, setSearchOverview] = useState("");
  const [searchReleaseDate, setSearchReleaseDate] = useState("");
  const [searchGenres, setSearchGenres] = useState("");

  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [error, setError] = useState();

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      const data = await response.json();
      setAllMovies(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const allGenres = useMemo(
    () => [...new Set(allMovies.flatMap((movie) => movie.genres || []))],
    [allMovies],
  );

  const filterMovies = useCallback(() => {
    let filtered = [...allMovies];

    if (searchId) {
      filtered = filtered.filter((movie) => movie.id.toString() === searchId);
    }

    if (searchTitle) {
      const searchLower = searchTitle.toLowerCase();
      filtered = filtered.filter((movie) =>
        movie.title?.toLowerCase().includes(searchLower),
      );
    }

    if (searchOverview) {
      const searchLower = searchOverview.toLowerCase();
      filtered = filtered.filter((movie) =>
        movie.overview?.toLowerCase().includes(searchLower),
      );
    }

    if (searchReleaseDate) {
      filtered = filtered.filter((movie) => {
        const movieDate = new Date(
          movie.release_date * 1000,
        ).toLocaleDateString("en-CA");
        return movieDate.startsWith(searchReleaseDate);
      });
    }

    if (searchGenres) {
      const searchLower = searchGenres.toLowerCase();
      filtered = filtered.filter((movie) =>
        movie.genres?.some((genre) =>
          genre.toLowerCase().includes(searchLower),
        ),
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (movie) =>
          movie.title?.toLowerCase().includes(searchLower) ||
          movie.overview?.toLowerCase().includes(searchLower),
      );
    }

    if (selectedGenre !== "all") {
      filtered = filtered.filter((movie) =>
        movie.genres?.includes(selectedGenre),
      );
    }

    setFilteredMovies(filtered);
  }, [
    allMovies,
    searchId,
    searchTitle,
    searchOverview,
    searchReleaseDate,
    searchGenres,
    searchTerm,
    selectedGenre,
  ]);

  useEffect(() => {
    filterMovies();
  }, [filterMovies]);

  const clearFilter = () => {
    setSearchTerm("");
    setSelectedGenre("all");
    setSearchId("");
    setSearchTitle("");
    setSearchOverview("");
    setSearchReleaseDate("");
    setSearchGenres("");
  };

  const exportToCSV = () => {
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

    const csvRows = filteredMovies.map((movie) => {
      const releaseDate = new Date(
        movie.release_date * 1000,
      ).toLocaleDateString("en-CA");
      const genres = movie.genres ? movie.genres.join("; ") : ""; // Changed to semicolon to avoid comma issues

      // Escape fields that contain commas, quotes, or newlines
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return "";
        const stringField = String(field);
        // Always wrap fields with commas, quotes, or newlines in quotes
        if (
          stringField.includes(",") ||
          stringField.includes('"') ||
          stringField.includes("\n")
        ) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      return [
        movie.id, // Don't escape ID, it's just a number
        escapeCSV(movie.title),
        `"${releaseDate}"`,
        escapeCSV(genres),
        escapeCSV(movie.overview),
        escapeCSV(movie.poster),
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create blob and download with BOM for proper Excel encoding
    const BOM = "\uFEFF"; //  Add BOM for proper UTF-8 encoding in Excel
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `movies_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const itemSize = 130;
  const bufferItems = 15;

  // Calculate total height more accurately
  const totalHeight = useMemo(() => {
    return filteredMovies.length * itemSize;
  }, [filteredMovies.length, itemSize]);

  // Better viewport calculations
  const { visibleMovies, offsetY } = useMemo(() => {
    const containerHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.8 : 800;

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemSize) - bufferItems,
    );

    const visibleCount = Math.ceil(containerHeight / itemSize);
    const endIndex = Math.min(
      filteredMovies.length,
      startIndex + visibleCount + bufferItems * 2,
    );

    return {
      visibleMovies: filteredMovies.slice(startIndex, endIndex),
      offsetY: startIndex * itemSize,
    };
  }, [filteredMovies, scrollTop, itemSize, bufferItems]);

  // Throttled scroll handler
  const scrollabe = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  return (
    <div className="flex-col justify-center items-center bg-gray-100 min-h-screen">
      <div className="flex text-3xl justify-center mb-4 pt-4">
        Movie Listing
      </div>

      <section className="mb-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <Input
          label="Search"
          type="text"
          placeholder="Search title or overview"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />

        <Input
          label="Search By Title"
          type="text"
          placeholder="Search title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Genre
          </span>

          <select
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="all">All Genres</option>
            {allGenres.map((genre, idx) => (
              <option key={idx} value={genre}>
                {genre === "all" ? "All genres" : genre}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Search By Release Date"
          type="text"
          placeholder="YYYY-MM-DD"
          onChange={(e) => setSearchReleaseDate(e.target.value)}
          value={searchReleaseDate}
        />

        <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
          {isVisible && (
            <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
              <Input
                label="Search By ID"
                type="text"
                placeholder="Search ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />

              <Input
                label="Search By Genres"
                type="text"
                placeholder="Search genres..."
                value={searchGenres}
                onChange={(e) => setSearchGenres(e.target.value)}
              />

              <Input
                label="Search By Overview"
                type="text"
                placeholder="Search overview..."
                value={searchOverview}
                onChange={(e) => setSearchOverview(e.target.value)}
              />
            </div>
          )}

          <div className="ml-auto m-2 flex items-center gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={clearFilter}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-500"
            >
              Reset filters
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              onClick={exportToCSV}
              disabled={filteredMovies.length === 0}
            >
              📥 Export to CSV ({filteredMovies.length})
            </button>
            <button
              type="button"
              className="rounded-xl border border-emerald-900 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-500"
              onClick={() => setIsVisible(!isVisible)}
            >
              Advanced Search
            </button>
          </div>
        </div>
      </section>
      <p className="flex items-center justify-center mb-2 text-gray-600">
        Showing {filteredMovies.length} out of {allMovies.length} movies
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <p className="text-xl">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-[80vh]">
          <p className="text-xl text-red-500">{error.message}</p>
        </div>
      ) : (
        <div
          className="overflow-auto h-[80vh]"
          onScroll={scrollabe}
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
                  {visibleMovies.map((movie) => {
                    const index = filteredMovies.findIndex(
                      (m) => m.id === movie.id,
                    );
                    return (
                      <Table.Row key={movie.id}>
                        <Table.Cell className="hidden sm:table-cell">
                          {index + 1}
                        </Table.Cell>

                        <Table.Cell className="hidden sm:table-cell">
                          <div className="flex h-20 w-20">
                            <img
                              src={movie.poster}
                              alt={`${movie.title} poster`}
                              loading="lazy"
                            />
                          </div>
                          ID: {movie.id}
                        </Table.Cell>
                        <Table.Cell className="text-lg">
                          <img
                            className="sm:hidden h-20 w-20"
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            loading="lazy"
                          />
                          {movie.title}
                        </Table.Cell>

                        <Table.Cell className="hidden md:table-cell">
                          {new Date(
                            movie.release_date * 1000,
                          ).toLocaleDateString("en-CA")}
                        </Table.Cell>
                        <Table.Cell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {movie.genres.map((genre, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-200 text-gray-800 px-2 py-1 rounded-sm text-xs"
                              >
                                {genre}
                              </div>
                            ))}
                          </div>
                        </Table.Cell>
                        <Table.Cell>{movie.overview}</Table.Cell>
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
