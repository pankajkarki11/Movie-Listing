import './App.css'
import{Route,Routes} from 'react-router-dom'
import MovieListing from './pages/Listing'    

function App() {
  return (
   <>
   <Routes>
    <Route path='/' element={<MovieListing/>}/>

   </Routes>
   
   </>
   
  )
}

export default App
