import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

function App() {
  const [token, setToken] = useState(null);
  const [songs, setSongs] = useState([]);
  const [user, setUser] = useState(null);


  useEffect(() => { // called on page load
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    if (accessToken) {
      setToken(accessToken);
      fetchLikedSongs(accessToken);
      fetchUserProfile(accessToken);

    }
  }, []);

  const fetchLikedSongs = async (accessToken) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/liked-songs?access_token=${accessToken}`);
      setSongs(response.data.items);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  };

  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  

  const playSong = async (trackUri) => {
    try {
      await axios.put(`${BACKEND_URL}/play`, { access_token: token, track_uri: trackUri });
    } catch (error) {
      console.error("Error playing song:", error);
    }
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
          <h1>Liked Songs</h1>
          <ul>
            {songs.map((item) => (
              <li key={item.track.id}>
                {item.track.name} - {item.track.artists[0].name}
                <button onClick={() => playSong(item.track.uri)}>▶ Play</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
  
}

export default App;
