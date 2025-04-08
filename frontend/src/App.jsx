import { useEffect, useState } from "react";
import axios from "axios";
import { SongHandler } from "./player";

const BACKEND_URL = "http://localhost:3001";

// Global token variable
let token = null;
let songHandlerActive = false;
let start = false;

const totalSongs = 1000;
const playerSize = 250;


function App() {
  const [user, setUser] = useState(null);
  const [songHandler, setSongHandler] = useState();
  const [curSelectedRadio, setCurSelectedRadio] = useState(0);
  const [radios, setRadios] = useState([]); // Frontend radio = backend songPlayer

  useEffect(() => {
    asyncStart();
  }, []);

  const asyncStart = async () => {
    if(start) return;
    start = true;
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    if (accessToken) {
      token = accessToken; // Update the global token
      const songList = await fetchLikedSongs(accessToken,totalSongs);
      const userData = await fetchUserProfile(accessToken);

      


      setUser(userData);
      console.log('Creating new SongHandler instance useEffect');
      setSongHandler(new SongHandler(songList, accessToken));
    }
  };

  // Use useEffect to handle songHandler changes
  useEffect(() => {
    
    if (songHandler && !songHandlerActive) {
      songHandlerActive = true;
      console.log("songHandler created by useEffect");
      songHandler.createSongPlayers((playerSize));
      songHandler.startAllSongPlayers();
      setRadios(songHandler.songPlayers);
    }
  }, [songHandler]);

  const fetchLikedSongs = async (accessToken, maxSongs) => {
    let allSongs = [];
    let offset = 0;
    const limit = Math.min(totalSongs, 50);

    while (allSongs.length < maxSongs) {
      const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          limit: limit,
          offset: offset,
        },
      });

      const songs = response.data.items;
      allSongs = allSongs.concat(songs);

      if (songs.length < limit) {
        // If fewer songs are returned than requested, we've reached the end
        break;
      }

      offset += limit; // Move to the next batch
    }

    return allSongs;
  };

  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleGroupButtonClick = (index) => {
    console.log(`Button clicked for player ${index}`);
    setCurSelectedRadio(index);
    songHandler.selectPlayer(index);
  };

  

  return (
    <div>
      {!token ? (
        <a href={`${BACKEND_URL}/login`}>
          <button>Login with Spotify</button>
        </a>
      ) : (
        <>
          {user && user.images?.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <img
                src={user.images[0].url}
                alt="Profile"
                style={{ width: "80px", height: "80px", borderRadius: "50%" }}
              />
              <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{user.display_name}</p>
            </div>
          )}
          <h1>Radios</h1>
          <ul>
            {radios.map((radio, index) => (
              <li key={index}>
                <button onClick={() => handleGroupButtonClick(radio.playerIndex)}>
                  Radio {radio.playerIndex}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
