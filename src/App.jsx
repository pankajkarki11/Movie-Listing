import "./App.css";
import { Route, Routes } from "react-router-dom";
// import MovieListing from './pages/Listing'
// import List from './pages/demo'
// import MovieListing from './pages/demo2'
// import List from './pages/demo3'
import List from "./pages/Listing";
import Listed from "./pages/tries/demoooos";
// import ListingPro from "./pages/ListingPro";
// import Demo from "./pages/demoooooois";

function App() {
  return (
    <>
      <Routes>
        {/* <Route path='/' element={<MovieListing/>}/> */}
        <Route path="/" element={<List />} />
        {/* <Route path="/" element={<Listed />} /> */}
        {/* <Route path="/" element={<ListingPro/>}/> */}
        {/* <Route path="/" element={<Demo />} /> */}
      </Routes>
    </>
  );
}

export default App;
