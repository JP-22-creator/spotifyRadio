require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const querystring = require("querystring");

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;

// 1. Login Route - Redirects to Spotify Authorization
// app.get("/page") respons to requests
app.get("/login", (req, res) => {
    const scope = "user-library-read user-modify-playback-state user-read-playback-state streaming";
    // what we want
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({ // builds url we go to
        response_type: "code",
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
    })}`;
    res.redirect(authUrl); // what the clien gets
});

// 2. Exchange Code for Access Token
// /callback is the redirectURI so when login is succesfull this wil happen
app.get("/callback", async (req, res) => {
    const code = req.query.code;
    const tokenUrl = "https://accounts.spotify.com/api/token";
    
    const data = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    try {
        const response = await axios.post(tokenUrl, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = response.data.access_token;
    res.redirect(`${FRONTEND_URI}/?access_token=${accessToken}`);


    } catch (error) {
        console.error("Error getting token:", error);
        res.status(500).send("Authentication failed");
    }
});

// 3. Get Liked Songs
app.get("/liked-songs", async (req, res) => {
  const accessToken = req.query.access_token;
  
  try {
    const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching liked songs:", error);
    res.status(500).send("Failed to fetch liked songs");
  }
});

// 4. Play a Song
app.put("/play", async (req, res) => {
  try {
    const { accessToken, uri, timestamp } = req.body;
    const response = await axios.put(
      "https://api.spotify.com/v1/me/player/play",
      {
        uris: [uri],
        position_ms: timestamp * 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("Error playing song:", error);
    res.status(500).json({ error: "Failed to play song" });
  }
});

app.put("/pause", async (req, res) => {
  try {
    const { accessToken } = req.body;
    console.log("Attempting to pause playback with token:", accessToken ? "Token present" : "No token");
    
    const response = await axios.put(
      "https://api.spotify.com/v1/me/player/pause",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      }
    );
    console.log("Pause response:", response.status);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error pausing playback:", error.response?.data || error.message);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    res.status(500).json({ 
      error: "Failed to pause playback",
      details: error.response?.data || error.message
    });
  }
});


app.listen(3001, () => console.log("Server running"));
