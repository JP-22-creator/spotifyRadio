let players = new Map(); // Store state for each player

// Web Workers use onmessage instead of addEventListener
self.onmessage = function(event) {
  console.log('Worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SIMULATE_SONG':
      console.log('Starting simulation for player:', data.playerIndex);
      players.set(data.playerIndex, {
        currentTime: data.currentTime,
        songDuration: data.duration,
        isPlaying: true,
        timer: null
      });
      startTimer(data.playerIndex);
      break;
      
    case 'STOP_SIMULATION':
      stopPlayer(data.playerIndex);
      break;
      
    case 'PAUSE_SIMULATION':
      pausePlayer(data.playerIndex);
      break;
      
    case 'RESUME_SIMULATION':
      resumePlayer(data.playerIndex);
      break;
  }
};

function startTimer(playerIndex) {
  console.log(`Starting timer for player ${playerIndex}`);
  const player = players.get(playerIndex);
  if (!player) {
    console.log(`No player found for index ${playerIndex}`);
    return;
  }

  if (player.timer) {
    clearInterval(player.timer);
  }

  if (!player.isPlaying) {
    console.log(`Player ${playerIndex} is not playing, skipping update`);
    return;
  }

  player.timer = setInterval(() => {    
    player.currentTime++;
  
    // Send time update to main thread
    if (player.currentTime >= player.songDuration) {
      stopPlayer(playerIndex);
      self.postMessage({
        type: 'SONG_FINISHED',
        playerIndex,
        currentTime: player.currentTime
      });
    } else {
      self.postMessage({
        type: 'TIME_UPDATE',
        playerIndex,
        currentTime: player.currentTime
      });
    }
  }, 1000);
}

function stopPlayer(playerIndex) {
  console.log(`Stopping player ${playerIndex}`);
  const player = players.get(playerIndex);
  if (!player) {
    console.log(`No player found to stop for index ${playerIndex}`);
    return;
  }

  if (player.timer) {
    clearInterval(player.timer);
  }
  player.isPlaying = false;
  players.delete(playerIndex);
}

function pausePlayer(playerIndex) {
  const player = players.get(playerIndex);
  if (player) {
    player.isPlaying = false;
  }
}

function resumePlayer(playerIndex) {
  const player = players.get(playerIndex);
  if (player) {
    player.isPlaying = true;
  }
}