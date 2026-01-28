import { useState, useEffect, useRef } from "react";
import Table from "./Table";
import Input from "./Input";

const List = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [error, setError] = useState();
  const [containerHeight, setContainerHeight] = useState(600); // Default height
  const containerRef = useRef(null);

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

  // Calculate responsive container height based on screen size
  useEffect(() => {
    const calculateContainerHeight = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // Calculate available space after considering header and filters
      const headerHeight = 80; // Approximate header height
      const filtersHeight = 120; // Approximate filters section height
      const margins = 40; // Padding and margins
      
      let baseHeight = screenHeight - headerHeight - filtersHeight - margins;
      
      // Adjust based on screen size for better UX
      if (screenWidth < 640) { // Mobile
        baseHeight = Math.max(300, screenHeight * 0.5); // 50% of screen, min 300px
      } else if (screenWidth < 768) { // Small tablet
        baseHeight = Math.max(400, screenHeight * 0.6); // 60% of screen, min 400px
      } else if (screenWidth < 1024) { // Tablet
        baseHeight = Math.max(500, screenHeight * 0.65); // 65% of screen, min 500px
      } else if (screenWidth < 1280) { // Laptop
        baseHeight = Math.max(600, screenHeight * 0.7); // 70% of screen, min 600px
      } else { // Desktop
        baseHeight = Math.max(700, screenHeight * 0.75); // 75% of screen, min 700px
      }
      
      return Math.floor(baseHeight);
    };

    // Set initial height
    setContainerHeight(calculateContainerHeight());

    // Update height on resize with debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setContainerHeight(calculateContainerHeight());
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    
    // Also update when window loads completely
    window.addEventListener("load", () => {
      setContainerHeight(calculateContainerHeight());
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", () => {
        setContainerHeight(calculateContainerHeight());
      });
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Also update height when loading state changes or content loads
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        const calculateContainerHeight = () => {
          const screenHeight = window.innerHeight;
          const screenWidth = window.innerWidth;
          
          if (screenWidth < 640) {
            return Math.max(300, screenHeight * 0.5);
          } else if (screenWidth < 768) {
            return Math.max(400, screenHeight * 0.6);
          } else if (screenWidth < 1024) {
            return Math.max(500, screenHeight * 0.65);
          } else if (screenWidth < 1280) {
            return Math.max(600, screenHeight * 0.7);
          } else {
            return Math.max(700, screenHeight * 0.75);
          }
        };
        setContainerHeight(calculateContainerHeight());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const allGenres = [
    ...new Set(allMovies.flatMap((movie) => movie.genres || [])),
  ];

  const filterMovies = () => {
    let filtered = [...allMovies];
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
  };

  useEffect(() => {
    filterMovies();
  }, [searchTerm, selectedGenre, allMovies]);

  const clearFilter = () => {
    setSearchTerm("");
    setSelectedGenre("all");
  };

  // Make itemsPerView responsive based on container height
  const getItemsPerView = () => {
    if (containerHeight < 400) return 3;
    if (containerHeight < 600) return 5;
    if (containerHeight < 900) return 7;
    return 5;
  };

  const itemsPerView = getItemsPerView();
  const itemSize = 200; //px
  const bufferItems = 20;
  const totalHeight = filteredMovies.length * itemSize;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemSize - bufferItems),
  );
  const endIndex = Math.min(
    filteredMovies.length,
    Math.ceil(scrollTop / itemSize) + itemsPerView + bufferItems,
  );
  const visibleMovies = filteredMovies.slice(startIndex, endIndex);
  const offsetY = startIndex * itemSize;

  const scrollabe = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div 
      className="flex-col justify-center items-center bg-gray-100 p-2 md:p-4 lg:p-6 min-h-screen"
      ref={containerRef}
    >
      {/* Title */}
      <div className="flex text-xl sm:text-2xl md:text-3xl justify-center mb-3 sm:mb-4 p-2">
        Movie Listing
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 p-2 w-full">
        <div className="w-full sm:w-auto sm:flex-1 max-w-sm md:max-w-md lg:max-w-lg">
          <Input
            className="w-full h-10 border-2 border-blue-500 rounded-lg px-3 sm:px-4 text-sm md:text-base"
            label="Search"
            type="text"
            placeholder="Search by title or overview"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            aria-label="Search movies"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px]">
          <select
            className="w-full h-10 border-2 border-gray-500 rounded-lg px-3 sm:px-4 text-sm md:text-base"
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
        </div>

        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-400 transition-colors text-sm md:text-base whitespace-nowrap"
          onClick={clearFilter}
        >
          Clear Filter
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-lg">Loading movies...</p>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          {/* Display current screen size and container height for debugging (optional) */}
          <div className="text-xs text-gray-500 text-center mb-2 hidden sm:block">
            Screen: {typeof window !== 'undefined' ? `${window.innerWidth}px × ${window.innerHeight}px` : ''} | 
            Container: {containerHeight}px | 
            Showing {visibleMovies.length} of {filteredMovies.length} movies
          </div>

          {/* Responsive table container */}
          <div
            className="overflow-auto w-full border border-gray-300 rounded-lg shadow-sm"
            onScroll={scrollabe}
            style={{ 
              height: `${containerHeight}px`,
              maxHeight: '80vh' // Prevent exceeding 80% of viewport
            }}
          >
            <div style={{ height: `${totalHeight}px`, position: "relative" }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                <Table>
                  <Table.Header>
                    <Table.HeaderCell className="hidden sm:table-cell">
                      id
                    </Table.HeaderCell>
                    <Table.HeaderCell>title</Table.HeaderCell>
                    <Table.HeaderCell className="hidden md:table-cell">
                      release_date
                    </Table.HeaderCell>
                    <Table.HeaderCell className="hidden lg:table-cell">
                      Genre
                    </Table.HeaderCell>
                    <Table.HeaderCell>Overview</Table.HeaderCell>
                  </Table.Header>

                  <Table.Body>
                    {visibleMovies.map((movie) => (
                      <Table.Row key={movie.id} className="hover:bg-gray-50">
                        <Table.Cell className="hidden sm:table-cell">
                          <div className="h-16 w-12 sm:h-20 sm:w-14 md:h-24 md:w-16 mx-auto">
                            <img
                              src={movie.poster}
                              alt={`${movie.title} poster`}
                              className="h-full w-full object-cover rounded"
                            />
                          </div>
                          <div className="text-center mt-1 text-xs">
                            ID: {movie.id}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="font-medium text-sm md:text-base">
                          {movie.title}
                        </Table.Cell>

                        <Table.Cell className="hidden md:table-cell text-sm">
                          {new Date(movie.release_date * 1000).toLocaleDateString(
                            "en-CA"
                          )}
                        </Table.Cell>
                        <Table.Cell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {movie.genres.map((genre, index) => (
                              <span
                                key={index}
                                className="bg-gray-200 text-gray-800 px-2 py-1 rounded-sm text-xs"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-xs sm:text-sm max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg truncate hover:whitespace-normal">
                          {movie.overview}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>
          
          {/* Mobile summary info */}
          <div className="sm:hidden mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">
                {filteredMovies.length} movies • Height: {containerHeight}px
              </span>
              <span className="text-xs text-gray-600">
                ← Scroll →
              </span>
            </div>
            {selectedGenre !== "all" && (
              <div className="mt-1 text-xs">
                Filtered by: <span className="font-medium">{selectedGenre}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default List;