import React, { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from 'react-webcam';
import './App.css';

const App = () => {
  const webcamRef = useRef(null);
  const [postureStatus, setPostureStatus] = useState('Unknown');

  useEffect(() => {
    const runPoseDetection = async () => {
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {
          runtime: 'tfjs',
        }
      );

      const analyzePosture = async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const poses = await detector.estimatePoses(video);

          if (poses.length > 0) {
            const landmarks = poses[0].keypoints;

            const leftEye = landmarks.find((pt) => pt.name === 'left_eye');
            const rightEye = landmarks.find((pt) => pt.name === 'right_eye');
            const leftShoulder = landmarks.find((pt) => pt.name === 'left_shoulder');
            const rightShoulder = landmarks.find((pt) => pt.name === 'right_shoulder');

            if (leftEye && rightEye && leftShoulder && rightShoulder) {
              const avgEyeY = (leftEye.y + rightEye.y) / 2;
              const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
              const yDistance = Math.abs(avgEyeY - avgShoulderY);

              if (yDistance < 39) {
                setPostureStatus('Poor Posture');
              } else {
                setPostureStatus('Good Posture');
              }
            }
          }
        }
      };

      const interval = setInterval(analyzePosture, 1000);
      return () => clearInterval(interval);
    };

    runPoseDetection();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-brown-800">
      <h1 className="text-4xl font-bold mb-4">Positure</h1>
      <div className="border-4 border-brown-600 rounded-lg overflow-hidden w-2/3">
        <Webcam ref={webcamRef} className="w-full" />
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
