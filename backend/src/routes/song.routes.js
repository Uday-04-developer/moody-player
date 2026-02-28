const express = require("express");
const Song = require("../model/song.model");
const router = express.Router();
const uploadFile = require("../service/storage.service");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const songModel = require("../model/song.model");

// Fetch the 10 most recently added songs
router.get("/recent", async (req, res) => {
  try {
    const recentSongs = await songModel
      .find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10); // Only grab the last 10 songs

    res.status(200).json({
      message: "Recent songs fetched successfully",
      songs: recentSongs,
    });
  } catch (error) {
    console.error("Error fetching recent songs:", error);
    res.status(500).json({ message: "Failed to fetch recent songs" });
  }
});

router.post("/songs", upload.single("audio"), async (req, res) => {
  try {
    // 👈 1. Added safety net
    console.log(req.body);
    console.log(req.file);

    // 👈 2. Quick safety check: Did they actually attach a file?
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    // Your exact original logic:
    // const fileData = await uploadFile(req.file);
    // console.log(fileData);
    const fileData = await uploadFile(req.file);
    console.log(fileData); // 👈 THIS IS OUR CLUE!

    const song = await songModel.create({
      title: req.body.title,
      artist: req.body.artist,
      audioUrl: fileData, // Note: You used 'url' here instead of 'audioUrl'. This is perfect, we will just remember this for the frontend!
      mood: req.body.mood,
    });

    res.status(201).json({
      message: "Song created successfully",
      Song: song,
    });
  } catch (error) {
    // 👈 3. Catching the crash
    console.error("Error during song upload:", error);
    res.status(500).json({ message: "Internal server error during upload" });
  }
});

router.get("/songs", async (req, res) => {
  const { mood } = req.query;
  const songs = await songModel.find({
    mood: mood,
  });
  res.status(200).json({
    message: "Songs fetched successfully",
    songs: songs,
  });
});

module.exports = router;
