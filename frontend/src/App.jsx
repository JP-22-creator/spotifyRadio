import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

class SongPlayer {
  constructor(songs) {
    this.songs = songs;
    this.currentSongIndex = 0;
    this.currentTime = 0;
    this.isPlaying = false;
    this.interval = null;
  }

  start() {
    if (this.songs.length === 0) return;
    this.isPlaying = true;
    this.playCurrentSong();
  }

  playCurrentSong() {
    if (this.currentSongIndex >= this.songs.length) return;
    const currentSong = this.songs[this.currentSongIndex];
    console.log(`Playing: ${currentSong.track.name}`);
    this.interval = setInterval(() => {
      this.currentTime++;
      if (this.currentTime >= currentSong.track.duration_ms / 1000) {
        this.nextSong();
      }
    }, 1000);
  }

  nextSong() {
    clearInterval(this.interval);
    this.currentSongIndex++;
    this.currentTime = 0;
    if (this.currentSongIndex < this.songs.length) {
      this.playCurrentSong();
    } else {
      this.isPlaying = false;
      console.log("Finished playing all songs in the group.");
    }
  }

  playFromCurrentTime() {
    clearInterval(this.interval);
    this.playCurrentSong();
  }
}

function App() {
  const [token, setToken] = useState(null);
  const [songs, setSongs] = useState([]);
  const [user, setUser] = useState(null);
  const [songPlayers, setSongPlayers] = useState([]);

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
  

  const playSong = async (trackUri, timestamp) => {
    try {
      const deviceId = await activateDevice();
      if (!deviceId) return;
  
      await axios.put(`${BACKEND_URL}/play`, {
        accessToken: token,
        uri: trackUri,
        timestamp: timestamp,
      });
    } catch (error) {
      console.error("Error playing song:", error);
      alert("Something went wrong while trying to play the song.");
    }
  };
  

  const groupSongs = (songs, groupSize) => {
    const groups = [];
    for (let i = 0; i < songs.length; i += groupSize) {
      groups.push(songs.slice(i, i + groupSize));
    }
    return groups;
  };

  const songGroups = groupSongs(songs, 10);

  useEffect(() => {
    if (songs.length > 0) {
      const groups = groupSongs(songs, 10);
      const players = groups.map(group => new SongPlayer(group));
      setSongPlayers(players);
      players.forEach(player => player.start());
    }
  }, [songs]);

  const handleGroupButtonClick = (index) => {
    const player = songPlayers[index];
    if (player) {
      const currentSong = player.songs[player.currentSongIndex];
      if (currentSong) {
        playSong(currentSong.track.uri, player.currentTime);
      }
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
          <h1>Song Groups</h1>
          <ul>
            {songGroups.map((group, index) => (
              <li key={index}>
                <button onClick={() => handleGroupButtonClick(index)}>
                  Play Group {index + 1}
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
