import sys
import cv2
import mediapipe as mp
import numpy as np
from PyQt5.QtWidgets  import QApplication, QLabel, QPushButton, QVBoxLayout, QWidget
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import QTimer

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

class PostureAnalyzer(QWidget):
    def __init__(self):
        super().__init__()
        
        self.initUI()
        
        self.cap = cv2.VideoCapture(0)
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(30)

    def initUI(self):
        self.setWindowTitle("Posture Analyzer")
        self.setGeometry(100, 100, 800, 600)
        
        self.video_label = QLabel(self)
        self.status_label = QLabel("Posture Status: ", self)
        self.status_label.setStyleSheet("font-size: 18px; font-weight: bold;")
        
        self.quit_button = QPushButton("Quit", self)
        self.quit_button.clicked.connect(self.close)
        
        layout = QVBoxLayout()
        layout.addWidget(self.video_label)
        layout.addWidget(self.status_label)
        layout.addWidget(self.quit_button)
        self.setLayout(layout)
    
    def update_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            return
        
        frame = cv2.flip(frame, 1)  # Mirror image
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        results = pose.process(frame_rgb)
        posture_status = "Unknown"
        
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_eye = landmarks[mp_pose.PoseLandmark.LEFT_EYE]
            right_eye = landmarks[mp_pose.PoseLandmark.RIGHT_EYE]
            
            shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
            eye_y = (left_eye.y + right_eye.y) / 2
            
            y_distance = abs(eye_y - shoulder_y)
            print(y_distance)
            
            if y_distance < 0.39:
                posture_status = "Poor Posture"
                color = (0, 0, 255)  # Red
            else:
                posture_status = "Good Posture"
                color = (0, 255, 0)  # Green
            
            self.status_label.setText(f"Posture Status: {posture_status}")
            
            """for landmark in [left_shoulder, right_shoulder, left_eye, right_eye]:
                h, w, _ = frame.shape
                cx, cy = int(landmark.x * w), int(landmark.y * h)
                cv2.circle(frame, (cx, cy), 5, color, -1)"""
        
        frame_qt = QImage(frame_rgb, frame_rgb.shape[1], frame_rgb.shape[0], frame_rgb.strides[0], QImage.Format_RGB888)
        self.video_label.setPixmap(QPixmap.fromImage(frame_qt))
    
    def closeEvent(self, event):
        self.cap.release()
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = PostureAnalyzer()
    window.show()
    sys.exit(app.exec_())
