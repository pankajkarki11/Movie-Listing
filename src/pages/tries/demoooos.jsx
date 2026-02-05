import { useState, useEffect } from "react";
import Table from "../Table";
import Input from "../Input";
import { set } from "date-fns";

const Listed = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMovies, setFilteredMovies] = useState([]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      const data = await response.json();
      setMovies(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const filterMovies = () => {
    let filtered = [...movies];

    if (searchTerm) {
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.overview.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredMovies(filtered);
  };

  useEffect(() => {
    filterMovies();
  }, [searchTerm, movies]);

  const itemPerPage = 40;
  const startIndex = (page - 1) * itemPerPage;
  const endIndex = page * itemPerPage;
  const visibleMovies = filteredMovies.slice(startIndex, endIndex);

  return (
    <div className="w-370 m-6 p-8 text-gray-900 bg-blue-300">
      <h1 className="flex items-center justify-center text-gray-800 text-2xl ">
        This is the list of Movies in the database
      </h1>

      <div className="w-300 align-center m-6 p-8 text-gray-900 bg-red-200 flex flex-col items-center justify-center">
        <Input
          type="text"
          label="Search"
          placeholder="Search the datebase"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />

        <p>
          Showing {filteredMovies.length} of {movies.length} movies
        </p>
        <Table>
          <Table.Header>
            <Table.HeaderCell>S.N</Table.HeaderCell>
            <Table.HeaderCell>Movie Id</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Released Date</Table.HeaderCell>
            <Table.HeaderCell>Genre</Table.HeaderCell>
            <Table.HeaderCell>OverView</Table.HeaderCell>
          </Table.Header>

          <Table.Body>
            {visibleMovies.map((movie) => {
              const index = movies.findIndex((m) => m.id === movie.id);
              return (
                <Table.Row key={movie.id}>
                  <Table.Cell>{index + 1}</Table.Cell>
                  <Table.Cell>
                    <img src={movie.poster} />
                    {movie.id}
                  </Table.Cell>
                  <Table.Cell>{movie.title}</Table.Cell>
                  <Table.Cell>{movie.release_date}</Table.Cell>
                  <Table.Cell>
                    {movie.genres.map((genre, index) => (
                      <div key={index}> {genre}</div>
                    ))}
                  </Table.Cell>
                  <Table.Cell>{movie.overview}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        <div className="flex items-center justify-center gap-6">
          <button
            className="h-10 w-10 p-2 m-6 rounded-sm bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition:translation disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              setPage(1);
            }}
            disabled={page == 1}
          >
            1
          </button>

          <button
            className="h-10 w-10 p-2 m-6 rounded-sm bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition:translation disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              setPage(2);
            }}
            disabled={page == 2}
          >
            2
          </button>

          <button
            className="h-10 w-10 p-2 m-6 rounded-sm bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition:translation disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              setPage(3);
            }}
            disabled={page == 3}
          >
            3
          </button>

          <button
            className="h-10 w-10 p-2 m-6 rounded-sm bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition:translation disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              setPage(4);
            }}
            disabled={page == 4}
          >
            4
          </button>

          <button
            className="h-10 w-10 p-2 m-6 rounded-sm bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition:translation disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              setPage(5);
            }}
            disabled={page == 5}
          >
            5
          </button>
        </div>
      </div>
    </div>
  );
};

export default Listed;
