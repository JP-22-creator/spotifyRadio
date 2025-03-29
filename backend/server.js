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
app.get("/login", (req, res) => {
    const scope = "user-library-read user-modify-playback-state streaming";
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: "code",
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
    })}`;
    res.redirect(authUrl);
});

// 2. Exchange Code for Access Token
app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            querystring.stringify({
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
                },
            }
        );
        res.redirect(`${FRONTEND_URI}/?access_token=${response.data.access_token}`);
    } catch (error) {
        res.status(400).json({ error: "Authentication failed" });
    }
});

// 3. Get Liked Songs
app.get("/liked-songs", async (req, res) => {
    const { access_token } = req.query;
    try {
        const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        res.json(response.data);
    } catch (error) {
        res.status(400).json({ error: "Failed to fetch songs" });
    }
});

// 4. Play a Song
app.put("/play", async (req, res) => {
    const { access_token, track_uri } = req.body;
    try {
        await axios.put(
            "https://api.spotify.com/v1/me/player/play",
            { uris: [track_uri] },
            { headers: { Authorization: `Bearer ${access_token}` } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: "Failed to play song" });
    }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
