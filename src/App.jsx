import "./App.css";
import { Route, Routes } from "react-router-dom";
import List from "./pages/Listing";
import ListingPro from "./pages/tries/ListingPro";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<List />} />
       
        <Route path="/pro" element={<ListingPro />} />
      </Routes>
    </>
  );
}

export default App;
