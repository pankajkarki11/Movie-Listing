import { useReducer, useMemo, useCallback } from "react";

const initialFilterState = {
  searchId: "",
  searchTitle: "",
  searchOverview: "",
  searchReleaseDate: "",
  searchGenres: "",
  searchTerm: "",
  selectedGenre: "all",
};

const filterReducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.field]: action.value };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
};

const useMovieFilters = (movies) => {
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);

  const updateFilter = useCallback((field, value) => {
    dispatch({ type: "SET_FILTER", field, value });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  // Extract unique genres for dropdown
  const allGenres = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.genres || []))],
    [movies]
  );

  // Apply all filters with proper null/undefined handling
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // ID exact match
      if (filters.searchId && movie.id.toString() !== filters.searchId) {
        return false;
      }

      // Title partial match
      if (filters.searchTitle) {
        if (!movie.title?.toLowerCase().includes(filters.searchTitle.toLowerCase())) {
          return false;
        }
      }

      // Overview partial match
      if (filters.searchOverview) {
        if (!movie.overview?.toLowerCase().includes(filters.searchOverview.toLowerCase())) {
          return false;
        }
      }

      // Release date prefix match
      if (filters.searchReleaseDate) {
        if (!movie.release_date) return false;
        try {
          const movieDate = new Date(movie.release_date * 1000).toLocaleDateString("en-CA");
          if (!movieDate.startsWith(filters.searchReleaseDate)) {
            return false;
          }
        } catch (error) {
          return false; // Invalid date handling
        }
      }

      // Genre partial match (any genre contains search term)
      if (filters.searchGenres) {
        const hasMatchingGenre = movie.genres?.some((genre) =>
          genre.toLowerCase().includes(filters.searchGenres.toLowerCase())
        );
        if (!hasMatchingGenre) return false;
      }

      // Global search (title OR overview)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = movie.title?.toLowerCase().includes(searchLower);
        const matchesOverview = movie.overview?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesOverview) {
          return false;
        }
      }

      // Genre dropdown exact match
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