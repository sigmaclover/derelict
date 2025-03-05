import React, { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from 'react-webcam';
import './App.css';

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [postureStatus, setPostureStatus] = useState('Unknown');
  const missedDetections = useRef(0);

  const drawLandmarks = (landmarks, color = 'green') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    landmarks.forEach((landmark) => {
      if (landmark.score > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    const runPoseDetection = async () => {
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        { runtime: 'tfjs' }
      );
      console.log('Detector created:', detector);

      const analyzePosture = async () => {

        if (webcamRef.current && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const canvas = canvasRef.current;

          console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);


          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          
          const offscreenCanvas = document.createElement('canvas');
          const offscreenCtx = offscreenCanvas.getContext('2d');
          offscreenCanvas.width = video.videoWidth;
          offscreenCanvas.height = video.videoHeight;
          offscreenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

          const poses = await detector.estimatePoses(offscreenCanvas); //passing video feed through canvas
          //const poses = await detector.estimatePoses(video);
          console.log('Poses detected:', poses);


          if (poses.length > 0) {
            const landmarks = poses[0].keypoints;
            drawLandmarks(landmarks, postureStatus === 'Good Posture' ? 'green' : 'red');

            const leftEye = landmarks.find(pt => pt.name === 'left_eye' && pt.score > 0.5);
            const rightEye = landmarks.find(pt => pt.name === 'right_eye' && pt.score > 0.5);
            const leftShoulder = landmarks.find(pt => pt.name === 'left_shoulder' && pt.score > 0.5);
            const rightShoulder = landmarks.find(pt => pt.name === 'right_shoulder' && pt.score > 0.5);

            if (leftEye && rightEye && leftShoulder && rightShoulder) {
              const avgEyeY = (leftEye.y + rightEye.y) / 2;
              const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
              const yDistance = Math.abs(avgEyeY - avgShoulderY);

              if (yDistance < 39) {
                setPostureStatus('Poor Posture');
              } else {
                setPostureStatus('Good Posture');
              }
              console.log(leftEye, rightEye, leftShoulder, rightShoulder)
              missedDetections.current = 0;
            } else {
              missedDetections.current += 1;
              if (missedDetections.current >= 3) {
                setPostureStatus('Unknown');
              }
            }
          } else {
            drawLandmarks([], 'transparent');
            console.log(missedDetections.current)
            missedDetections.current += 1;
            if (missedDetections.current >= 3) {
              setPostureStatus('Unknown');
            }
          }
        }
      };

      const interval = setInterval(analyzePosture, 1000);
      return () => clearInterval(interval);
    };

    runPoseDetection();
  }, [postureStatus]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-brown-800">
      <h1 className="text-4xl font-bold mb-4">Positure</h1>
      <div className="relative border-4 border-brown-600 rounded-lg overflow-hidden w-2/3 aspect-video">
        <Webcam ref={webcamRef} className="absolute top-0 left-0 w-full h-full" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      </div>
      <p className="mt-4 text-xl font-semibold">
        Posture Status: <span className="text-brown-600">{postureStatus}</span>
      </p>
      {postureStatus === 'Poor Posture' && (
        <div className="mt-4 p-2 bg-red-500 text-white font-bold rounded">
          Alert: Please correct your posture!
        </div>
      )}
    </div>
  );
};

export default App;
