const mongoose = require('mongoose');
const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  audioUrl: { type: String, required: true },
  mood: { type: String }
 

}, { timestamps: true }); 
// By adding { timestamps: true } at the very end, you are turning on Mongoose's automatic time-keeper. Now, every single time a song is uploaded, Mongoose will invisibly add two extra pieces of data to it:

// createdAt: The exact millisecond the song was added.

// updatedAt: The exact millisecond the song was last edited.

const Song = mongoose.model('Song',songSchema);
module.exports = Song
