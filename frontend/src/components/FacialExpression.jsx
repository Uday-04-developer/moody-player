import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import "../components/FacialExpression.css";
// import "..components/"
export default function FacialExpression() {
  const videoRef = useRef(null);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    startVideo();
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  async function detectMood() {

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (!detections || detections.length === 0) {
        console.log("No face detected");
        return;
      }

      let mostProableExpression = 0;
      let _expression = "";
      for (const expression of Object.keys(detections[0].expressions)) {
        if (detections[0].expressions[expression] > mostProableExpression) {
          mostProableExpression = detections[0].expressions[expression];
          _expression = expression;
        }
      }
      if (detections.length > 0) {
        console.log(_expression);
      }
   
  }
  

  useEffect(() => {
    loadModels().then(startVideo);
    
  }, []);

  return (
    <div className="mood-element">
      <video className="user-video-feed" ref={videoRef} autoPlay muted />

      <button onClick={detectMood}>Detect Mood</button>
    </div>
  );
}
