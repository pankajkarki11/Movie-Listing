import { useState, useEffect, use } from "react";
import Table from "./Table";

const MovieListing = () => {
  const [movie, setMovie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div>
      <div className="flex text-3xl justify-center ">Movie Listing</div>
      {loading ? (
        <div className="animate-spin text-blue-500">X</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.HeaderCell>Movie ID</Table.HeaderCell>
            <Table.HeaderCell>Movie Title</Table.HeaderCell>
            <Table.HeaderCell>Release Date</Table.HeaderCell>
            <Table.HeaderCell>Genre</Table.HeaderCell>
            <Table.HeaderCell>OverView</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {movie.slice(0, 20).map((movie) => (
              <Table.Row key={movie.id}>
                <Table.Cell>
                  {" "}
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-lg object-cover mr-3"
                      src={movie.poster}
                      alt={movie.title}
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
                  {movie.genres.map((genre, index) => (
                    <div
                      key={index}
                      className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1 mb-1"
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
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};

export default MovieListing;
