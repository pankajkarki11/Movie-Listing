import { useState, useEffect, use } from "react";
import Table from "./Table";

const MovieListing = () => {
  const [currentMovies, setCurrentMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Allyedge/movies/refs/heads/main/data/movies.json",
      );
      const data = await response.json();
      setCurrentMovies(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

//  const moviesPerPage = 30;



// const startIndex = (page - 1) * moviesPerPage;
// const endIndex = page * moviesPerPage;
// const currentMovies = movies.slice(startIndex, endIndex);

  return (
    <div>
      <div className="flex text-3xl justify-center ">Movies Listing</div>
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
            {currentMovies.map((currentMovies) => (
              <Table.Row key={currentMovies.id}>
                <Table.Cell>
                  {" "}
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-lg object-cover mr-3"
                      src={currentMovies.poster}
                      alt={currentMovies.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {currentMovies.id}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell className="text-md">{currentMovies.title}</Table.Cell>
                <Table.Cell className="text-sm">{currentMovies.release_date}</Table.Cell>
                <Table.Cell className="text-sm">
                  {currentMovies.genres.map((genre, index) => (
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
                    {currentMovies.overview}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

       
      )}

       {/* <div className="flex justify-center mt-4">
       {page > 1 &&   <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
            onClick={() =>{ setPage(page - 1)
               window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page === 1}
          >
            Previous
          </button>}




          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r ml-10"
             onClick={() =>{ setPage(page + 1)
               window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={endIndex >= movies.length}
          >
            Next
          </button>
        </div> */}
    </div>
  );
};

export default MovieListing;
