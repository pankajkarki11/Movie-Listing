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


  
   const exportToCSV =useCallback(() => {
    if (filteredMovies.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Release Date",
      "Genres",
      "Overview",
      "Poster URL",
    ];

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return "";
      const stringField = String(field);

      if (
        stringField.includes(",") ||
        stringField.includes('"') ||
        stringField.includes("\n") ||
        stringField.includes("\r")
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const csvRows = filteredMovies.map((movie) => {
      let releaseDate = "";
      if (movie.release_date) {
        try {
          releaseDate = new Date(movie.release_date * 1000).toLocaleDateString("en-CA");
        } catch (e) {
          releaseDate = "Invalid Date";
        }
      }

      const genres = movie.genres ? movie.genres.join("; ") : "";

      return [
        movie.id || "",
        escapeCSV(movie.title),
        escapeCSV(releaseDate),
        escapeCSV(genres),
        escapeCSV(movie.overview),
        escapeCSV(movie.poster),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `movies_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();

  
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, [filteredMovies]);


  return {
    filters,
    updateFilter,
    clearFilters,
    filteredMovies,
    allGenres,
    exportToCSV,
  };
};

export default useMovieFilters; 