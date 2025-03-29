import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

// Global token variable
let token = null;

// Define playSong outside
const playSong = async (trackUri, timestamp) => {
  console.log("Playing song:", trackUri, timestamp);
  try {
    const deviceAvailable = await availableDevices();
    if (!deviceAvailable) return;

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

// Define availableDevices outside
const availableDevices = async () => {
  try {
    const devicesRes = await axios.get("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const devices = devicesRes.data.devices;

    if (!devices || devices.length === 0) {
      alert("No available Spotify devices found.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking devices:", error.response?.data || error.message);
    alert("Couldn't check for Spotify devices.");
    return false;
  }
};

class SongPlayer {
  constructor(songs, groupIndex, isSelected) {
    this.songs = songs;
    this.currentSongIndex = 0;
    this.currentTime = 0;
    this.isPlaying = false;
    this.interval = null;
    this.groupIndex = groupIndex;
    this.isSelected = isSelected;
    this.currentSong = null;
  }

  start() {
    if (this.songs.length === 0) return;
    this.isPlaying = true;
    this.playCurrentSong();
  }

  playCurrentSong() {
    if (this.currentSongIndex >= this.songs.length) return;
    this.currentSong = this.songs[this.currentSongIndex];

    this.interval = setInterval(() => {
      this.currentTime++;
      console.log(`Group ${this.groupIndex}, Current time: ${this.currentTime}`);
      if (this.currentTime >= this.currentSong.track.duration_ms / 1000) {
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
      if (this.isSelected) {
        playSong(this.songs[this.currentSongIndex].track.uri, this.currentTime);
      }
    } else {
      this.isPlaying = false;
      console.log("Finished playing all songs in the group.");
    }
  }

  playFromCurrentTime() {
    playSong(this.currentSong.track.uri, this.currentTime);
  }
}

function App() {
  const [songs, setSongs] = useState([]);
  const [user, setUser] = useState(null);
  const [songPlayers, setSongPlayers] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    if (accessToken) {
      token = accessToken; // Update the global token
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
      const players = groups.map((group, index) => new SongPlayer(group, index, false));
      setSongPlayers(players);
      players.forEach(player => player.start());
    }
  }, [songs]);

  const handleGroupButtonClick = (index) => {
    setSelectedGroupIndex(index);
    const player = songPlayers[index];
    songPlayers.forEach(player => player.isSelected = false);
    player.isSelected = true;
    if (player) {
      if (player.currentSong) {
        player.playFromCurrentTime();
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
