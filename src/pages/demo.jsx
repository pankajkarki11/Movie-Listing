import { useState, useEffect } from "react";
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

  const itemsPerView = 6;
  const itemSize = 80; //px
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
    <div className="flex-col justify-center items-center bg-gray-100">
      <div className="flex text-3xl justify-center mb-4">Movie Listing</div>

      <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
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
      </div>
      {loading ? (
        <p>loading...</p>
      ) : (
        <div
          className="overflow-auto h-[90vh] md:h-[90vh] lg:h-[80vh]"
          onScroll={scrollabe}
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
                    <Table.Row key={movie.id}>
                      <Table.Cell className="hidden sm:table-cell ">
                        <div className="flex h-20 w-20">
                          <img
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                          />
                        </div>
                        ID: {movie.id}
                      </Table.Cell>
                      <Table.Cell className="text-lg">
                         <img className="sm:hidden"
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            
                          />
                          {movie.title}


                      </Table.Cell>

                      <Table.Cell className="hidden md:table-cell">
                        {new Date(movie.release_date * 1000).toLocaleDateString(
                          "en-CA",
                        )}
                      </Table.Cell>
                      <Table.Cell className="hidden lg:table-cell">
                        {movie.genres.map((genre, index) => (
                          <div
                            key={index}
                            className="bg-gray-200 text-gray-800 px-2 py-1 rounded-sm mr-1 mb-2 text-xs"
                          >
                            {genre}
                          </div>
                        ))}
                      </Table.Cell>
                      <Table.Cell>{movie.overview}</Table.Cell>
                    </Table.Row>
                  ))}
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
