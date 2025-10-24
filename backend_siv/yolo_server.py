# backend_siv/app/flask_yolo_multi.py
from flask import Flask, Response
from ultralytics import YOLO
import cv2
from threading import Thread
import queue
import time
import random

app = Flask(__name__)

# ---------------------------
# Configuración modelo YOLO
# ---------------------------
model = YOLO("yolov8s.pt")  # Modelo más preciso
device = "cpu"             # "cuda" = GPU, "cpu" = CPU
conf_threshold = 0.4        # Confianza mínima

# ---------------------------
# Configuración de cámaras (video local o RTSP)
# ---------------------------
video_paths = {
    1: "backend_siv/videos/cam1.mp4",
    2: "backend_siv/videos/cam2.mp4",
    3: "backend_siv/videos/cam3.mp4",
    4: "backend_siv/videos/cam4.mp4",
}

# Cola de frames y output por cámara
frame_queues = {cam_id: queue.Queue(maxsize=5) for cam_id in video_paths}
output_frames = {cam_id: None for cam_id in video_paths}

# ---------------------------
# Captura de video por cámara
# ---------------------------
def capture_frames(cam_id):
    cap = cv2.VideoCapture(video_paths[cam_id])
    if not cap.isOpened():
        print(f"❌ No se pudo abrir el video de la cámara {cam_id}")
        return
    print(f"✅ Cámara {cam_id} abierta correctamente")
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        if not frame_queues[cam_id].full():
            frame_queues[cam_id].put(frame)
        else:
            time.sleep(0.001)

# ---------------------------
# Procesamiento YOLO por cámara
# ---------------------------
def process_frames(cam_id):
    global output_frames
    while True:
        if not frame_queues[cam_id].empty():
            frame = frame_queues[cam_id].get()
            results = model.predict(frame, imgsz=1280, conf=conf_threshold, device=device)
            for r in results:
                boxes = r.boxes.xyxy.cpu().numpy()
                classes = r.boxes.cls.cpu().numpy()
                confidences = r.boxes.conf.cpu().numpy()
                for box, cls, conf in zip(boxes, classes, confidences):
                    x1, y1, x2, y2 = map(int, box[:4])
                    class_name = model.names[int(cls)]
                    label = f"{class_name} {conf*100:.1f}%"

                    # Color según tipo
                    if class_name == "car":
                        color = (0, 255, 0)
                    elif class_name == "motorbike":
                        color = (255, 0, 0)
                    else:
                        color = (0, 0, 255)

                    # Bounding box y etiqueta
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
                    cv2.rectangle(frame, (x1, y1 - text_h - 6), (x1 + text_w, y1), color, -1)
                    cv2.putText(frame, label, (x1, y1 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            output_frames[cam_id] = frame
        else:
            time.sleep(0.001)

# ---------------------------
# Generador MJPEG
# ---------------------------
def gen_frames(cam_id):
    global output_frames
    while True:
        if output_frames[cam_id] is None:
            time.sleep(0.01)
            continue
        ret, buffer = cv2.imencode('.jpg', output_frames[cam_id])
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# ---------------------------
# Endpoint streaming
# ---------------------------
@app.route('/camera/<int:cam_id>/stream')
def camera_stream(cam_id):
    if cam_id not in video_paths:
        return "Cámara no encontrada", 404
    return Response(gen_frames(cam_id),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# ---------------------------
# Endpoint de congestión simulado
# ---------------------------
@app.route('/camera/<int:cam_id>/congestion')
def congestion(cam_id):
    # Simula congestión aleatoria
    congested = random.choice([True, False])
    return {"cam_id": cam_id, "congestion": congested}

# ---------------------------
# Iniciar hilos
# ---------------------------
if __name__ == "__main__":
    for cam_id in video_paths:
        t1 = Thread(target=capture_frames, args=(cam_id,), daemon=True)
        t2 = Thread(target=process_frames, args=(cam_id,), daemon=True)
        t1.start()
        t2.start()
    print("🚀 Servidor Flask corriendo en http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, threaded=True)
