import { availableDevices } from "./utility";
import axios from "axios";
const BACKEND_URL = "http://localhost:3001";


export class SongHandler {
    constructor(songs, token) {
      console.log('Creating new SongHandler instance');
      this.songs = songs;
      this.token = token;
      this.curSelectedPlayer = 0;
      this.songPlayers = [];
      this.worker = null;
      
      this.initializeWorker();
    }
    
    initializeWorker() {
      this.worker = new Worker(new URL('../public/web-worker.js', import.meta.url));
      
      this.worker.onmessage = (event) => {
        const { type, playerIndex, currentTime } = event.data;
        
        switch (type) {
          case 'TIME_UPDATE':
            const player = this.songPlayers.find(p => p.playerIndex === playerIndex);
            if (player) {
              player.currentTime = currentTime;
            }
            break;

          case 'SONG_FINISHED':
            const finishedPlayer = this.songPlayers.find(p => p.playerIndex === playerIndex);
            if (finishedPlayer) {
              finishedPlayer.nextSong();
            }
            break;
        }
      };
    }
  
    createSongPlayers(groupSize) {
      console.log('Creating song players, current songPlayers length:', this.songPlayers.length);
      this.songPlayers = [];

      let shuffledSongs = this.songs;
      shuffledSongs = this.shuffleArray(shuffledSongs);
      let startIndex = 0;
      let endIndex = startIndex + groupSize;
      let playerIndex = 0;


      while (startIndex < shuffledSongs.length) {
        const songGroup = shuffledSongs.slice(startIndex, endIndex);
        console.log(`Creating player ${playerIndex} with ${songGroup.length} songs`);
        const songPlayer = new SongPlayer(songGroup, playerIndex, this);
        this.songPlayers.push(songPlayer);

        playerIndex++;
        startIndex += groupSize;
        endIndex += groupSize;
      }
      console.log(`Created ${this.songPlayers.length} players. Current songPlayers:`, this.songPlayers);
    }

    startAllSongPlayers() {
      this.songPlayers.forEach(player => player.start());
    }

    cleanup() {
      if (this.worker) {
        this.worker.terminate();
      }
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

    selectPlayer(playerIndex) {
      console.log(`Selecting player ${playerIndex} (previous: ${this.curSelectedPlayer})`);
      console.log('Current songPlayers array:', this.songPlayers);
      this.curSelectedPlayer = playerIndex;
      
      const selectedPlayer = this.songPlayers.find(p => p.playerIndex === playerIndex);
      if (selectedPlayer) {
        console.log(`Found player ${playerIndex}, starting playback`);
        selectedPlayer.playFromCurrentTime();
      } else {
        console.error(`Player ${playerIndex} not found! Available players: ${this.songPlayers.map(p => p.playerIndex).join(', ')}`);
      }
    }

    getCurrentPlayerIndex() {
      return this.curSelectedPlayer;
    }
    
    shuffleArray(array) {
      let currentIndex = array.length;

      // While there remain elements to shuffle...
      while (currentIndex != 0) {
    
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
      return array;
    }
}


export class SongPlayer {
    constructor(songs, playerIndex, handler) {
      this.handler = handler;
      this.songs = songs;
      this.playerIndex = playerIndex;
      this.currentSongIndex = 0;
      this.currentTime = 0;
      this.isPlaying = false;
      this.timer = null;
      console.log(`Player ${this.playerIndex} created`);
    }
    
    start() {
      if (this.songs.length === 0) return;
      
      this.isPlaying = true;
      this.simulateCurrentSong();
    }
  
    simulateCurrentSong() {
      if (!this.isInRange(this.currentSongIndex)) return;
      console.log("Playing song:", this.currentSong().track.name);

      if (this.handler.worker) {
        const currentSong = this.currentSong();
        this.handler.worker.postMessage({
          type: 'SIMULATE_SONG',
          data: {
            playerIndex: this.playerIndex,
            duration: currentSong.track.duration_ms / 1000,
            currentTime: this.currentTime
          }
        });
      }
    }
  
    nextSong() {
      this.currentSongIndex++;
      this.currentTime = 0;

      if (this.isInRange(this.currentSongIndex)) {
        this.simulateCurrentSong();
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

      const isSelected = this.playerIndex === this.handler.getCurrentPlayerIndex();
      console.log(`Player ${this.playerIndex} checking selection against ${this.handler.getCurrentPlayerIndex()}: ${isSelected}`);
      return isSelected;
    }

    currentSong = () => {
      if(this.isInRange(this.currentSongIndex)){
        return this.songs[this.currentSongIndex];
      }
      return null;
    }

    isInRange(index) {
      if(this.songs.length === 0){
        console.log("No songs in the group");
        return false; 
      }

      return (index <= this.songs.length - 1 && index >= 0);
    }
    
}