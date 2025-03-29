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
  

  const activateDevice = async () => {
    try {
      const devicesRes = await axios.get("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const devices = devicesRes.data.devices;
      console.log("Available Spotify Devices:", devices);
  
      if (!devices || devices.length === 0) {
        alert("No available Spotify devices found.");
        return null;
      }
  
      const activeDevice = devices.find((d) => d.is_active) || devices[0];
      console.log("Selected device:", activeDevice);
  
      await axios.put(
        "https://api.spotify.com/v1/me/player",
        {
          device_ids: [activeDevice.id],
          play: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      return activeDevice.id;
    } catch (error) {
      console.error("Error activating device:", error.response?.data || error.message);
      alert("Couldn't activate a Spotify device.");
      return null;
    }
  };
  

  const playSong = async (trackUri) => {
    try {
      const deviceId = await activateDevice();
      if (!deviceId) return;
  
      await axios.put(`${BACKEND_URL}/play`, {
        accessToken: token,
        uri: trackUri,
      });
    } catch (error) {
      console.error("Error playing song:", error);
      alert("Something went wrong while trying to play the song.");
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
