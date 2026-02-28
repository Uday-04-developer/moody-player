import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "./MoodCamera.css";
import axios from "axios";

export default function MoodCamera({ setSongs, setPlaylistTitle }) {
  // ==========================================
  // 1. REFS & STATE INITIALIZATION
  // ==========================================
  const videoRef = useRef(null); // Reference to the HTML <video> element
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Camera & Video States
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraOffTimer, setCameraOffTimer] = useState(null);
  
  // Detection & Countdown States
  const [isDetecting, setIsDetecting] = useState(false);
  const [countdown, setCountdown] = useState(null); // Tracks remaining seconds (3, 2, 1)
  const [countdownActive, setCountdownActive] = useState(false);
  
  // UI Result States
  const [mood, setMood] = useState(""); // Stores the final formatted mood string
  const [capturedImage, setCapturedImage] = useState(null);
  const [frozenFrame, setFrozenFrame] = useState(null); // Base64 image of the exact detected frame
  const [isFrameFrozen, setIsFrameFrozen] = useState(false); // Toggles between live video and frozen image

  // ==========================================
  // 2. INITIALIZATION EFFECTS
  // ==========================================
  useEffect(() => {
    // Load face-api.js machine learning models from the public/models directory
    const loadModels = async () => {
      setLoading(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        console.log("All face detection models loaded successfully");
      } catch (err) {
        console.error("Failed to load models:", err);
        setError("Failed to load face detection models. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    loadModels();

    // Cleanup function: Ensure the webcam hardware turns off if the user leaves the page
    return () => {
      stopCamera();
    };
  }, []);

  // ==========================================
  // 3. CAMERA HARDWARE CONTROLS
  // ==========================================
  
  // Requests permission and binds the webcam stream to the video element
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user", // Forces front-facing camera on mobile
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Manually force the video to play immediately to prevent timeout errors
        try {
          await videoRef.current.play();
        } catch (e) {
          console.log("Play started automatically");
        }

        // Reset UI states for a fresh live feed
        setIsFrameFrozen(false);
        setFrozenFrame(null);
        setIsCameraOn(true);
        setError("");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check camera permissions.");
      setIsCameraOn(false);
    }
  };

  // Promisified helper to ensure the video stream has enough data to be analyzed
  const waitForVideoReady = (video, timeoutMs = 3000) => {
    return new Promise((resolve, reject) => {
      if (!video) return reject(new Error("No video element"));

      // Check if video already has current data (readyState 2+)
      if (video.readyState >= 2) return resolve();

      const onReady = () => {
        clearTimeout(timer);
        resolve();
      };

      const timer = setTimeout(() => {
        // Cleanup listeners to prevent memory leaks on timeout
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("playing", onReady);

        if (video.readyState >= 2) {
          resolve();
        } else {
          reject(new Error("Timed out waiting for camera to start"));
        }
      }, timeoutMs);

      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("playing", onReady, { once: true });
    });
  };

  // Safely shuts down the webcam hardware to save battery and protect privacy
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop()); // Turns off the green hardware indicator light
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Extracts the current video frame into a base64 image via an HTML Canvas
  const captureAndFreezeFrame = () => {
    if (!videoRef.current) return null;

    const vw = videoRef.current.videoWidth || 0;
    const vh = videoRef.current.videoHeight || 0;
    
    if (vw === 0 || vh === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const capturedFrame = canvas.toDataURL("image/jpeg", 0.95);

    videoRef.current.pause();
    setIsFrameFrozen(true);

    return capturedFrame;
  };

  // Manages automated camera shutdown after a specific delay
  const scheduleCameraOff = (delayInSeconds) => {
    if (cameraOffTimer) clearTimeout(cameraOffTimer);

    const timer = setTimeout(() => {
      stopCamera();
      setMood("");
      setFrozenFrame(null);
      setIsFrameFrozen(false);
    }, delayInSeconds * 1000);

    setCameraOffTimer(timer);
  };

  // ==========================================
  // 4. CORE AI DETECTION LOGIC
  // ==========================================
  
  // Triggers the 3-second UI countdown before firing the AI detection
  const startCountdown = () => {
    setCountdownActive(true);
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);
        setCountdownActive(false);
        performDetection(); // Trigger the actual ML analysis
      }
    }, 1000);
  };

  // Executes the face-api.js ML model and processes the results
  const performDetection = async () => {
    setIsDetecting(true);
    setError("");

    // Prevent execution if hardware isn't ready
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setMood("Camera not ready. Try again.");
      setIsDetecting(false);
      return;
    }

    try {
      // Step 1: Run ML detection on the live video element
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.length > 0) {
        // --- CAPTURE & FREEZE SEQUENCE ---
        
        // Extract the exact frame the AI analyzed
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);
        const capturedDataUrl = canvas.toDataURL("image/jpeg");

        // Lock the UI on the captured frame
        setFrozenFrame(capturedDataUrl);
        setIsFrameFrozen(true);

        // Turn off the webcam hardware immediately to signal completion to user
        stopCamera();

        // --- PRODUCTION INTERPRETATION LAYER ---
        let rawExpression = "";
        let highestScore = 0;
        const expressions = detections[0].expressions;

        // Find the highest scoring emotion from the raw AI output
        for (const [expression, score] of Object.entries(expressions)) {
          if (score > highestScore) {
            highestScore = score;
            rawExpression = expression;
          }
        }

        // Confidence Threshold: Default to neutral if AI is unsure (< 55%)
        if (highestScore < 0.55) {
          rawExpression = "neutral";
        }

        // Emotion Grouping: Map the 7 raw facial expressions to 4 core Music Moods
        const MOOD_MAPPING = {
          happy: "Happy",
          sad: "Sad",
          angry: "Energetic",
          surprised: "Energetic",
          fearful: "Calm",
          disgusted: "Calm",
          neutral: "Chill"
        };

        const targetMusicMood = MOOD_MAPPING[rawExpression] || "Chill";

     // Update the UI to show the user exactly what's happening
        const formattedMood = `${capitalizeFirstLetter(rawExpression)} (${Math.round(highestScore * 100)}%)  ${targetMusicMood} Music`;
        setMood(formattedMood);
        // 👉  THIS LINE: Change the heading from "Recently Added" to "Happy Music"
        setPlaylistTitle(`${targetMusicMood} Mood Songs`);

        // --- BACKEND INTEGRATION ---
        // Fetch songs based on the newly mapped mood
        axios.get(`http://localhost:3000/songs?mood=${targetMusicMood}`)
          .then(response => {
            if (response.data && response.data.songs) {
              setSongs(response.data.songs); // Lifts state up to App.jsx
            }
          })
          .catch(error => {
            console.error("Error fetching songs:", error);
          });

        setIsDetecting(false);
      } else {
        // Fallback if the AI couldn't find a face in the frame
        setMood("No face detected - Try again!");
        setIsDetecting(false);
      }
    } catch (err) {
      console.error("Detection error:", err);
      setMood("Detection failed.");
      setIsDetecting(false);
    }
  };

  // ==========================================
  // 5. USER INTERACTION & UI HELPERS
  // ==========================================

  // Utility to format string output
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Main interaction handler for the primary action button
  const handleClick = async () => {
    if (loading) return;

    // Reset previous results for a fresh attempt
    setMood("");
    setFrozenFrame(null);
    setIsFrameFrozen(false);

    // Flow A: Camera is currently off (Start it, wait, then countdown)
    if (!isCameraOn) {
      await startCamera();
      if (videoRef.current) {
        try {
          await waitForVideoReady(videoRef.current, 4000);
          startCountdown();
        } catch (err) {
          console.error("Video did not start in time:", err);
          setError("Camera did not start. Check permissions.");
          setIsCameraOn(false);
        }
      }
    }
    // Flow B: Camera is already running (Go straight to countdown)
    else if (!isDetecting && !countdownActive) {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play();
      }
      startCountdown();
    }
  };

  // Maps the current mood string to a contextual emoji for the UI
  const getMoodEmoji = () => {
    if (!mood) return "";
    const moodText = mood.toLowerCase();
    if (moodText.includes("happy")) return "😊";
    if (moodText.includes("sad")) return "😢";
    if (moodText.includes("angry")) return "😠";
    if (moodText.includes("surprised")) return "😲";
    if (moodText.includes("fearful")) return "😨";
    if (moodText.includes("disgusted")) return "🤢";
    if (moodText.includes("neutral")) return "😐";
    return "🤔";
  };

  // Maps the current mood string to an encouraging user message
  const getMoodMessage = () => {
    if (!mood) return "";
    if (mood.includes("No face detected")) {
      return "Try again - make sure your face is clearly visible";
    }

    const moodType = mood.toLowerCase();
    if (moodType.includes("happy")) return "Great to see you happy! Enjoy uplifting music.";
    if (moodType.includes("sad")) return "We'll play comforting music to lift your spirits.";
    if (moodType.includes("angry")) return "Let's calm down with some relaxing tunes.";
    if (moodType.includes("neutral")) return "We'll find music that matches your balanced mood.";
    return "Enjoy music tailored to your emotions.";
  };

  // ==========================================
  // 6. COMPONENT RENDER (JSX)
  // ==========================================
  return (
    <div className="mood-section glass">
      
      {/* --- VIDEO CONTAINER PORTION --- */}
      <div className="video-container">
        {/* Toggle between the frozen analyzed frame and the live camera feed */}
        {frozenFrame && isFrameFrozen ? (
          <div className="frozen-frame-container">
            <img
              src={frozenFrame}
              alt="Analyzed moment"
              className="frozen-frame"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />
            <div className="freeze-message">📸 This frame was analyzed</div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            className={`mood-video glass-video ${isCameraOn ? "active" : "inactive"}`}
            style={{ transform: "scaleX(-1)" }} // Mirror effect for natural feeling
          />
        )}

        {/* UI Overlay for the 3-second countdown */}
        {countdownActive && (
          <div className="countdown-overlay">
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-text">Get ready for mood detection</div>
          </div>
        )}
      </div>

      {/* --- CONTENT & CONTROLS PORTION --- */}
      <div className="mood-content caveat-unique">
        <h2>🎭 Live Mood Detection</h2>

        <p className="mood-description kalam-light">
          We'll analyze your facial expressions in 3 seconds and suggest music
          that matches your mood.
        </p>

        {/* Hardware & Detection Status Indicators */}
        <div className="status-indicators">
          <div className={`status-indicator ${isCameraOn ? "active" : ""}`}>
            <span className="status-dot"></span>
            Camera: {isCameraOn ? "ON" : "OFF"}
          </div>
          <div className={`status-indicator ${isDetecting || countdownActive ? "active" : ""}`}>
            <span className="status-dot"></span>
            Status: {countdownActive ? "COUNTDOWN" : isDetecting ? "DETECTING" : "READY"}
          </div>
        </div>

        {/* Primary Action Button (Dynamic based on current state) */}
        <button
          className={`mood-button ${isDetecting || countdownActive ? "detecting" : ""}`}
          onClick={handleClick}
          disabled={loading || (isDetecting && !countdownActive)}
        >
          {loading
            ? "Loading Models..."
            : countdownActive
            ? `Detecting in ${countdown}...`
            : isDetecting
            ? "Analyzing Mood..."
            : !isCameraOn
            ? "Start Listening 👂"
            : "Detect Mood Now 🔍"}
        </button>

        {/* Dynamic Results Display (Only shows if a mood was detected) */}
        {mood && (
          <div className="mood-result-container">
            <div className="mood-emoji">{getMoodEmoji()}</div>
            <p className="mood-result">
              {mood.includes("No face detected") ? (
                <>
                  <span className="error-text">{mood}</span>
                  <br />
                  <small className="retry-message">Click the button again to retry</small>
                </>
              ) : (
                <>
                  You're feeling: <span className="mood-text">{mood}</span>
                  <br />
                  <small className="mood-message">{getMoodMessage()}</small>
                </>
              )}
            </p>

            {/* Warning that camera tracks are about to unmount */}
            {!mood.includes("No face detected") && isCameraOn && (
              <div className="auto-off-message">
                <p className="kalam-light">
                  ⏳ Camera will turn off automatically in 3 seconds...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Global Error display (e.g. Permissions denied) */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Default Help Text (Hidden during active detection or error states) */}
        {!mood && !error && isCameraOn && !isDetecting && (
          <div className="help-text kalam-light">
            💡 Position your face in the frame and click "Detect Mood Now"
          </div>
        )}
      </div>
    </div>
  );
}