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
          movie.title.toLowerCase()?.includes(searchLower) ||
          movie.overview.toLowerCase()?.includes(searchLower),
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


  const clearFilter=()=>{
    setSearchTerm("");
    setSelectedGenre("all");
  }

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
     <div className="flex text-3xl justify-center ">Movie Listing</div>
      <div className="flex items-center justify-center ">
        <Input
          className="mr-20 w-90 h-10 border-3 border-lg border-blue-500 rounded-lg "
        label="Search"
          type="text"
          placeholder="Search by title or overview"
          
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          value={searchTerm}
        />

        <select
          className="m-12 w-60 h-10 border-3 border-lg border-gray-500 rounded-lg "
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          <option value="all">All Genre</option>

          {allGenres.map((genre, idx) => (
            <option key={idx} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <button className="m-2 p-2 border-2 bg-gray-300 rounded-full hover:bg-gray-500"
        onClick={()=>{clearFilter()}}
        >
            
            Clear Filter
        </button>
      </div>
      {loading ? (
        <p>loading...</p>
      ) : (
        <div
          className="overflow-auto"
          onScroll={scrollabe}
          style={{ height: "600px" }}
        >
          <div style={{ height: `${totalHeight}px`, position: "relative" }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              <Table>
                <Table.Header>
                  <Table.HeaderCell>id</Table.HeaderCell>
                  <Table.HeaderCell>title</Table.HeaderCell>
                  <Table.HeaderCell>release_date</Table.HeaderCell>
                  <Table.HeaderCell> Genre</Table.HeaderCell>
                  <Table.HeaderCell>Overview</Table.HeaderCell>
                </Table.Header>

                {visibleMovies.map((movie, id) => (
                  <Table.Body>
                    <Table.Row key={id}>
                      <Table.Cell>
                        <img src={movie.poster} className="h-30 w-70" />
                        ID: {movie.id}
                      </Table.Cell>
                      <Table.Cell>{movie.title}</Table.Cell>

                      <Table.Cell>
                        {new Date(
                          movie.release_date * 1000,
                        ).toLocaleDateString("en-CA")}
                      </Table.Cell>
                      <Table.Cell>
                        {movie.genres.map((genre, index) => (
                          <div
                            key={index}
                            className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1 mb-1 text-xs"
                          >
                            {genre}
                          </div>
                        ))}
                      </Table.Cell>
                      <Table.Cell>{movie.overview}</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                ))}
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
