import { useState, useMemo, useCallback } from "react";

const useMovieFilters = (movies) => {
  const [filters, setFilters] = useState({
    searchId: "",
    searchTitle: "",
    searchOverview: "",
    searchReleaseDate: "",
    searchGenres: "",
    searchTerm: "",
    selectedGenre: "all",
  });

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchId: "",
      searchTitle: "",
      searchOverview: "",
      searchReleaseDate: "",
      searchGenres: "",
      searchTerm: "",
      selectedGenre: "all",
    });
  }, []);


  const allGenres = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.genres || []))],
    [movies]
  );


  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      
      if (filters.searchId && movie.id.toString() !== filters.searchId) {
        return false;
      }

    
      if (filters.searchTitle) {
        if (!movie.title?.toLowerCase().includes(filters.searchTitle.toLowerCase())) {
          return false;
        }
      }

     
      if (filters.searchOverview) {
        if (!movie.overview?.toLowerCase().includes(filters.searchOverview.toLowerCase())) {
          return false;
        }
      }

     
      if (filters.searchReleaseDate) {
        if (!movie.release_date) return false;
        try {
          const movieDate = new Date(movie.release_date * 1000).toLocaleDateString("en-CA");
          if (!movieDate.startsWith(filters.searchReleaseDate)) {
            return false;
          }
        } catch (error) {
          return false; 
        }
      }

    
      if (filters.searchGenres) {
        const hasMatchingGenre = movie.genres?.some((genre) =>
          genre.toLowerCase().includes(filters.searchGenres.toLowerCase())
        );
        if (!hasMatchingGenre) return false;
      }


      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = movie.title?.toLowerCase().includes(searchLower);
        const matchesOverview = movie.overview?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesOverview) {
          return false;
        }
      }

    
      if (filters.selectedGenre !== "all") {
        if (!movie.genres?.includes(filters.selectedGenre)) {
          return false;
        }
      }

      return true;
    });
  }, [movies, filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filteredMovies,
    allGenres,
  };
};

export default useMovieFilters; 