import { useState } from "react";
import axios from "axios";
// You can reuse your existing CSS file if you have global glass classes, 
// or create a specific UploadSong.css later!

export default function UploadSong() {
  // 1. Form State
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mood, setMood] = useState("Chill"); // Default to Chill
  const [file, setFile] = useState(null);
  
  // 2. UI Feedback State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'success' or 'error'

  // 3. Handle File Selection
  const handleFileChange = (e) => {
    // Grab the first file the user selected
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 4. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from refreshing
    setMessage({ text: "", type: "" });

    // Basic Validation
    if (!title || !artist || !file) {
      setMessage({ text: "Please fill all fields and attach an audio file.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // 🌟 THE MAGIC: FormData
      // You cannot send files via standard JSON. You MUST use FormData.
      const formData = new FormData();
      formData.append("title", title);
      formData.append("artist", artist);
      formData.append("mood", mood);
      // "audio" MUST match the name in your backend: upload.single("audio")
      formData.append("audio", file); 

      // Send the request to your /songs route
      const response = await axios.post("http://localhost:3000/songs", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Tells the backend to expect a file!
        },
      });

      // If successful:
      setMessage({ text: "🎵 Song uploaded successfully!", type: "success" });
      
      // Clear the form for the next upload
      setTitle("");
      setArtist("");
      setMood("Chill");
      setFile(null);
      // Reset the file input visually
      document.getElementById("audio-upload").value = ""; 

    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ 
        text: error.response?.data?.message || "Failed to upload song. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section glass" style={{ maxWidth: "500px", margin: "2rem auto", padding: "2rem" }}>
      <h3 className="premium-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Upload New Track
      </h3>

      {/* Feedback Messages */}
      {message.text && (
        <div style={{ 
          padding: "10px", 
          marginBottom: "1rem", 
          borderRadius: "8px",
          textAlign: "center",
          backgroundColor: message.type === "success" ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)",
          color: message.type === "success" ? "#2ecc71" : "#e74c3c"
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* Title Input */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#a8b2c1" }}>Song Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Groove"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
          />
        </div>

        {/* Artist Input */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#a8b2c1" }}>Artist Name</label>
          <input 
            type="text" 
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Ethan Blake"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
          />
        </div>

        {/* Mood Selection (Matches your mapped categories exactly) */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#a8b2c1" }}>Target Mood</label>
          <select 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <option value="Happy" style={{ color: "#000" }}>Happy</option>
            <option value="Sad" style={{ color: "#000" }}>Sad</option>
            <option value="Energetic" style={{ color: "#000" }}>Energetic</option>
            <option value="Calm" style={{ color: "#000" }}>Calm</option>
            <option value="Chill" style={{ color: "#000" }}>Chill</option>
          </select>
        </div>

        {/* File Input */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#a8b2c1" }}>Audio File (.mp3, .wav)</label>
          <input 
            id="audio-upload"
            type="file" 
            accept="audio/*"
            onChange={handleFileChange}
            style={{ width: "100%", padding: "10px", color: "#a8b2c1" }}
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="mood-button" // Reusing your existing button style!
          style={{ marginTop: "1rem", width: "100%" }}
        >
          {loading ? "Uploading to Cloud... ⏳" : "Upload Track 🚀"}
        </button>

      </form>
    </div>
  );
}