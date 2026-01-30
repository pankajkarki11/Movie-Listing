import "./App.css";
import { Route, Routes } from "react-router-dom";
// import MovieListing from './pages/Listing'
// import List from './pages/demo'
// import MovieListing from './pages/demo2'
// import List from './pages/demo3'
import List from "./pages/Listing";

function App() {
  return (
    <>
      <Routes>
        {/* <Route path='/' element={<MovieListing/>}/> */}
        <Route path="/" element={<List />} />
      </Routes>
    </>
  );
}

export default App;
