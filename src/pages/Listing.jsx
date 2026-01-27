import { useState, useEffect, useRef } from "react";
import Table from "./Table";
import Input from "./Input";

const MovieListing = () => {
  const [allMovies, setAllMovies] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);//tracks how dar user has scrolled down(in pixels)
  
  const ITEM_HEIGHT = 80; // Approximate height of each table row in pixels
  const VISIBLE_ITEMS = 6; // Number 
  // of items visible in viewport
  const BUFFER_ITEMS = 20; // Items to keep above and below viewport

  // Fetch all movies once
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json"
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

  // Handle scroll event
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate which items to render
  const totalHeight = allMovies.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
  const endIndex = Math.min(
    allMovies.length,
    Math.ceil((scrollTop + VISIBLE_ITEMS * ITEM_HEIGHT) / ITEM_HEIGHT) + BUFFER_ITEMS
  );
  
  const visibleMovies = allMovies.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div>
      <div className="flex text-3xl justify-center mb-4">Movie Listing</div>
      <form type="submit" className="flex items-center justify-center ">
      <Input label="Search"
      className="text-gray-800"
      type="text"
      
      />


         <select
          
              className="w-70 ml-4 px-4 py-2.5 border border-gray-300 rounded-lg bg-white dtext-gray-900  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={visibleMovies.genres}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              
               {visibleMovies.genres?.map((genre, idx) => (
                            <option
                              key={idx} value={genre}
                              className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1 mb-1 text-xs"
                            >
                              {genre}
                            </option>
                          ))}
            </select>

            


</form>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin text-blue-500 text-4xl">⟳</div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">Error: {error.message}</div>
      ) : (
        <div
          onScroll={handleScroll}
          className="overflow-auto"
          style={{ height: "600px" }} // Fixed height for scrollable container
        >
          <div style={{ height: `${totalHeight}px`, position: "relative" }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              <Table>
                <Table.Header>
                  <Table.HeaderCell>Movie ID</Table.HeaderCell>
                  <Table.HeaderCell>Movie Title</Table.HeaderCell>
                  <Table.HeaderCell>Release Date</Table.HeaderCell>
                  <Table.HeaderCell>Genre</Table.HeaderCell>
                  <Table.HeaderCell>Overview</Table.HeaderCell>
                </Table.Header>
                <Table.Body>
                  {visibleMovies.map((movie, index) => {
                    const actualIndex = startIndex + index;
                    return (
                      <Table.Row key={movie.id}>
                        <Table.Cell>
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                              src={movie.poster}
                              alt={movie.title}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {movie.id}
                              </div>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>{movie.title}</Table.Cell>
                        <Table.Cell>{movie.release_date}</Table.Cell>
                        <Table.Cell>
                          {movie.genres?.map((genre, idx) => (
                            <div
                              key={idx}
                              className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1 mb-1 text-xs"
                            >
                              {genre}
                            </div>
                          ))}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="max-h-20 overflow-hidden text-sm">
                            {movie.overview}
                          </div>
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

export default MovieListing;