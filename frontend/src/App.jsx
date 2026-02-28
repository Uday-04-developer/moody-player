import { useEffect, useState } from 'react'

import './App.css'
// import FacialExpression from './components/facialexpression'
import MoodCamera from './components/MoodCamera'
import SongRecommendations from './components/SongRecommendations'
import Navbar from './components/Navbar'
import axios from 'axios'
import UploadSong from './components/UploadSong'


function App() {
  const [count, setCount] = useState(0)
  const [songs, setSongs] = useState([]);

  // This is dummy data 
//   const [songs, setSongs] = useState([
//   { title: "Sunrise Serenade", artist: "Ava Carter" },
//   { title: "Midnight Groove", artist: "Ethan Blake" },
//   { title: "Electric Pulse", artist: "Olivia Hayes" },
//   { title: "Tranquil Echoes", artist: "Noah Bennett" },
//   { title: "Rhythmic Heartbeat", artist: "Sophia Reed" },
//   { title: "Dreamy Horizons", artist: "Liam Foster" },
//   { title: "Urban Flow", artist: "Isabella Morgan" },
// ]);
const [playlistTitle, setPlaylistTitle] = useState("Discover Something New");
// 3. This runs exactly ONCE when the user opens the home page (/)
  useEffect(() => {
    const fetchRecentSongs = async () => {
      try {
        // Axios invisibly goes to your backend to grab the recent songs
        const response = await axios.get("http://localhost:3000/recent");
        
        if (response.data && response.data.songs) {
          setSongs(response.data.songs); // Put the songs on the screen!
        }
      } catch (error) {
        console.error("Error fetching recent songs on load:", error);
      }
    };

    fetchRecentSongs();
  }, []); // The empty array [] means "only run this once when the page loads"

  return (
    <>
         <>
      <Navbar />
      <div className="container">
        {/* <MoodCamera setSongs={setSongs} />
        <SongRecommendations songs={songs} /> */}
        <UploadSong />
        <MoodCamera 
          setSongs={setSongs} 
          setPlaylistTitle={setPlaylistTitle} 
        />
        <SongRecommendations 
          title={playlistTitle} 
          songs={songs} 
        />


      </div>

    </>
    </>
  )
}

export default App
