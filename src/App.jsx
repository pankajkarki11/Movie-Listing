import "./App.css";
import { Route, Routes } from "react-router-dom";
// import List from "./pages/Listing";
import ListingPro from "./pages/tries/ListingPro";
import List from "./pages/Listing";
import Todo from "./pages/tries/todo";
import MovieList from "./pages/Ag-gridListing";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<List />} />

        <Route path="/pro" element={<ListingPro />} />

        <Route path="/todo" element={<Todo />} />

      
        <Route path="/table" element={<MovieList />} />
      </Routes>
    </>
  );
}

export default App;
