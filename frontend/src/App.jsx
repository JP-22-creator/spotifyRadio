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
  const [curSelectedRadio, setCurSelectedRadio] = useState(-1);
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

    if(curSelectedRadio != index) {
      setCurSelectedRadio(index);
      songHandler.selectPlayer(index);
      }
  };

  const handlePausePlayback = () => {
    setCurSelectedRadio(-1);
    songHandler.curSelectedPlayer = -1;
    songHandler.pausePlayback();
  }

  const handlePreviousTrack = () => {
    if (curSelectedRadio !== -1) {
      songHandler.previousTrack();
    }
  }

  const handleNextTrack = () => {
    if (curSelectedRadio !== -1) {
      songHandler.nextTrack();
    }
  }

  return (
    <div style={{ 
      maxWidth: '100%', 
      padding: '1rem',
      boxSizing: 'border-box'
    }}>
      {!token ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh'
        }}>
          <a href={`${BACKEND_URL}/login`} style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              Login with Spotify
            </button>
          </a>
        </div>
      ) : (
        <>
          {user && user.images?.length > 0 && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "1rem", 
              marginBottom: "1.5rem",
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px'
            }}>
              <img
                src={user.images[0].url}
                alt="Profile"
                style={{ 
                  width: "60px", 
                  height: "60px", 
                  borderRadius: "50%",
                  border: '2px solid #1DB954'
                }}
              />
              <p style={{ 
                fontWeight: "bold", 
                fontSize: "1.1rem",
                color: '#fff'
              }}>
                {user.display_name}
              </p>
            </div>
          )}
          <h1 style={{ 
            fontSize: '2rem',
            marginBottom: '1.5rem',
            color: '#fff'
          }}>Radios</h1>
          
          <div style={{ 
            marginBottom: "2rem", 
            display: "flex", 
            gap: "0.5rem",
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button onClick={handlePreviousTrack} 
              style={{
                padding: "0.8rem 1.2rem",
                fontSize: "1rem",
                backgroundColor: "#1DB954",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              ⏮ Previous
            </button>
            <button onClick={handlePausePlayback} 
              style={{
                padding: "0.8rem 1.2rem",
                fontSize: "1rem",
                backgroundColor: "#1DB954",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              ⏸ Pause
            </button>
            <button onClick={handleNextTrack} 
              style={{
                padding: "0.8rem 1.2rem",
                fontSize: "1rem",
                backgroundColor: "#1DB954",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              Next ⏭
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
            padding: '0.5rem'
          }}>
            {radios.map((radio, index) => (
              <button 
                key={index}
                onClick={() => handleGroupButtonClick(radio.playerIndex)}
                style={{
                  padding: '1rem',
                  backgroundColor: curSelectedRadio === radio.playerIndex ? '#1DB954' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📻</span>
                <span style={{ 
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  Radio {radio.playerIndex}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
