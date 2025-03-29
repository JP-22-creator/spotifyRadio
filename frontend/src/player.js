import { availableDevices } from "./utility";
import axios from "axios";
const BACKEND_URL = "https://spotifyradio.onrender.com";


export class SongHandler {
    constructor(songs, token) {
      this.songs = songs;
      this.token = token;
      this.curSelectedPlayer = 0;
      this.songPlayers = [];
      
    }
  
    createSongPlayers (groupSize) {
      this.songPlayers = []; // Clear existing players to prevent duplicates
      let startIndex = 0;
      let endIndex = startIndex + groupSize;
      let groupIndex = 0;

       while (startIndex < this.songs.length) {
        const songGroup = this.songs.slice(startIndex, endIndex);
        const songPlayer = new SongPlayer(songGroup, groupIndex, this);
        this.songPlayers.push(songPlayer);

        groupIndex++;
        startIndex += groupSize;
        endIndex += groupSize;
      } 

    }

    startAllSongPlayers(){
      this.songPlayers.forEach(player => player.start());
    }


    playSong = async (trackUri, timestamp) => {
      try {
        const deviceAvailable = await availableDevices(this.token);
        if (!deviceAvailable) return;
    
        await axios.put(`${BACKEND_URL}/play`, {
          accessToken: this.token,
          uri: trackUri,
          timestamp: timestamp,
        });
      } catch (error) {
        console.error("Error playing song:", error);
        alert("Something went wrong while trying to play the song.");
      }
    };





  }


  export class SongPlayer {
    constructor(songs, playerIndex, handler) {
      this.handler = handler;
      this.songs = songs;
      this.playerIndex = playerIndex;

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
      if (!this.isInRange(this.currentSongIndex)) return;
      console.log("Playing song:", this.currentSong().track.name);
      const currentSong = this.currentSong();
  
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

      if (this.isInRange(this.currentSongIndex)) {
        this.playCurrentSong();
        if (this.isSelected()) {
          console.log(`Player: ${this.playerIndex}, Song: ${this.currentSongIndex}`);
          this.playFromCurrentTime();
        }
      } else {
        this.isPlaying = false;
        console.log("Finished playing all songs in the group.");
      }
    }
  
    playFromCurrentTime() {
      this.handler.playSong(this.currentSong().track.uri, this.currentTime);
    }
  
    isSelected = () => {
      if (this.handler === null) {
        console.log("No handler found");
        return false;
      }

      const isSelected = this.playerIndex === this.handler.curSelectedPlayer;
      console.log(`Player ${this.playerIndex} is ${isSelected ? "selected" : "not selected"}`);
      return isSelected;
    }

    currentSong = () => {
      return this.songs[this.currentSongIndex];
    }

    isInRange(index) {
      if(this.songs.length === 0){
        console.log("No songs in the group");
        return false; 
      }

      return (index <= this.songs.length && index >= 0);
    }
    
  }