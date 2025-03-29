import axios from "axios";

export const availableDevices = async (token) => {
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
  