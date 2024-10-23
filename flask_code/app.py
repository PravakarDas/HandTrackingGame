from flask import Flask, render_template, Response
import cv2
import mediapipe as mp
import math
import time
import random

app = Flask(__name__)

# Initialize MediaPipe's hand detection and landmark models
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)

# Circle parameters
circle_radius = 30
circle_center = (0, 0)
circle_visible = False
circle_appear_time = 0

# Function to generate a random position for the circle
def generate_random_position(frame_width, frame_height):
    x = random.randint(circle_radius, frame_width - circle_radius)
    y = random.randint(circle_radius, frame_height - circle_radius)
    return (x, y)

def generate_video_stream():
    cap = cv2.VideoCapture(0)
    
    global circle_center, circle_visible, circle_appear_time

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4),
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)
                )

                index_tip = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                index_tip_x = int(index_tip.x * frame.shape[1])
                index_tip_y = int(index_tip.y * frame.shape[0])
                distance = math.dist((index_tip_x, index_tip_y), circle_center)

                if index_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_PIP].y and distance <= circle_radius:
                    cv2.putText(frame, "IN", (frame.shape[1] - 70, frame.shape[0] - 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                else:
                    cv2.putText(frame, "OUT", (frame.shape[1] - 70, frame.shape[0] - 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        current_time = time.time()

        if circle_visible:
            if current_time - circle_appear_time >= 3:
                circle_visible = False
        else:
            if current_time - circle_appear_time >= 3:
                circle_visible = True
                circle_center = generate_random_position(frame.shape[1], frame.shape[0])
                circle_appear_time = time.time()

        if circle_visible:
            cv2.circle(frame, circle_center, circle_radius, (0, 255, 0), -1)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_video_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)
