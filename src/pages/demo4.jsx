import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Table from "./Table";
import Input from "./Input";
import { useVirtualizer } from "@tanstack/react-virtual";

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

  const listRef = useRef(null);

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

  // FIXED: CSV Export Function with proper formatting
  const exportToCSV = () => {
    if (filteredMovies.length === 0) {
      alert("No data to export!");
      return;
    }

    // Define CSV headers
    const headers = [
      "ID",
      "Title",
      "Release Date",
      "Genres",
      "Overview",
      "Poster URL",
    ];

    // Convert filtered movies to CSV rows
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
        `"${releaseDate}"`, // FIXED: Always quote dates to prevent Excel auto-formatting
        escapeCSV(genres),
        escapeCSV(movie.overview),
        escapeCSV(movie.poster),
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create blob and download with BOM for proper Excel encoding
    const BOM = "\uFEFF"; // FIXED: Add BOM for proper UTF-8 encoding in Excel
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

  const rowVirtualizer = useVirtualizer({
    count: filteredMovies.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 130,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // // FIXED: Better scrolling calculations
  // const itemSize = 130;
  // const bufferItems = 15; // Reduced buffer for better performance

  // // Calculate total height more accurately
  // const totalHeight = useMemo(() => {
  //   return filteredMovies.length * itemSize;
  // }, [filteredMovies.length, itemSize]);

  // // FIXED: Better viewport calculations
  // const { visibleMovies, offsetY } = useMemo(() => {
  //   const containerHeight = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800;

  //   const startIndex = Math.max(
  //     0,
  //     Math.floor(scrollTop / itemSize) - bufferItems,
  //   );

  //   const visibleCount = Math.ceil(containerHeight / itemSize);
  //   const endIndex = Math.min(
  //     filteredMovies.length,
  //     startIndex + visibleCount + (bufferItems * 2)
  //   );

  //   return {
  //     visibleMovies: filteredMovies.slice(startIndex, endIndex),
  //     offsetY: startIndex * itemSize
  //   };
  // }, [filteredMovies, scrollTop, itemSize, bufferItems]);

  // // FIXED: Throttled scroll handler
  // const scrollabe = useCallback((e) => {
  //   const newScrollTop = e.target.scrollTop;
  //   requestAnimationFrame(() => {
  //     setScrollTop(newScrollTop);
  //   });
  // }, []);

  return (
    <div className="flex-col justify-center items-center bg-gray-100 min-h-screen">
      <div className="flex text-3xl justify-center mb-4 pt-4">
        Movie Listing
      </div>

      <div className="flex items-center justify-center flex-wrap gap-4 mb-4 px-4">
        <Input
          className="w-80 h-10 border-2 border-blue-500 rounded-lg px-4"
          label="Search"
          type="text"
          placeholder="Search by title or overview"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
          aria-label="Search movies"
        />

        <select
          className="w-60 h-10 border-2 border-gray-500 rounded-lg px-4"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          aria-label="Filter by genre"
        >
          <option value="all">All Genres</option>
          {allGenres.map((genre, idx) => (
            <option key={idx} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <button
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-400 transition-colors"
          onClick={clearFilter}
        >
          Clear Filter
        </button>

        <button
          className="px-4 py-2 bg-blue-200 rounded-lg hover:bg-blue-400 transition-colors"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? "Hide" : "Show"} Column Search
        </button>

        <button
          className="px-4 py-2 bg-green-200 rounded-lg hover:bg-green-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={exportToCSV}
          disabled={filteredMovies.length === 0}
        >
          📥 Export to CSV ({filteredMovies.length})
        </button>
      </div>

      <p className="flex items-center justify-center mb-4 text-gray-600">
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
        <div className="overflow-auto h-[80vh]" ref={listRef}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualItem) => {
              const movie = filteredMovies[virtualItem.index];
              return (
                <div
                key={movie.id}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                    
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
                      {isVisible && (
                        <Table.Row>
                          <Table.Cell className="hidden sm:table-cell"></Table.Cell>
                          <Table.Cell className="hidden sm:table-cell">
                            <Input
                              placeholder="Id..."
                              label="Search By ID"
                              type="number"
                              onChange={(e) => setSearchId(e.target.value)}
                              value={searchId}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              placeholder="Search Title..."
                              type="text"
                              label="Search By Title"
                              onChange={(e) => setSearchTitle(e.target.value)}
                              value={searchTitle}
                            />
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            <Input
                              placeholder="Date..."
                              label="YYYY-MM"
                              type="text"
                              onChange={(e) =>
                                setSearchReleaseDate(e.target.value)
                              }
                              value={searchReleaseDate}
                            />
                          </Table.Cell>
                          <Table.Cell className="hidden lg:table-cell">
                            <Input
                              placeholder="Action..."
                              type="text"
                              label="Search By Genre"
                              onChange={(e) => setSearchGenres(e.target.value)}
                              value={searchGenres}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              placeholder="Search Overview"
                              type="text"
                              label="Search By Overview"
                              onChange={(e) =>
                                setSearchOverview(e.target.value)
                              }
                              value={searchOverview}
                            />
                          </Table.Cell>
                        </Table.Row>
                      )}

                      <Table.Row key={movie.id}>
                        <Table.Cell className="hidden sm:table-cell">
                          {virtualItem.index + 1}
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
                    </Table.Body>
                  </Table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
