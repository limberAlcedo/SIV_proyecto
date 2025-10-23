# backend_siv/app/main.py
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from ultralytics import YOLO
import cv2
import threading
import queue
import time
from collections import defaultdict

app = FastAPI(title="Backend SIV")

# ---------------------------
# Configuración CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Cargar modelos YOLO
# ---------------------------
model_vehicle = YOLO("yolov8n.pt")              # Vehículos
# model_plate = YOLO("yolov8n-license.pt")        # Patentes (si tienes el modelo)
# Si no tienes el modelo de patentes, comenta la línea de arriba.

# ---------------------------
# Rutas de videos
# ---------------------------
camera_videos = {
    1: "videos/cam1.mp4",
    2: "videos/cam2.mp4",
    3: "videos/cam3.mp4",
    4: "videos/cam4.mp4",
}

# ---------------------------
# Variables de congestión
# ---------------------------
SLOW_THRESHOLD = 5
SLOW_VEHICLE_COUNT = 3
CONSECUTIVE_FRAMES = 3
previous_positions = defaultdict(dict)
congestion_counter = defaultdict(int)

# ---------------------------
# Función de streaming con YOLO
# ---------------------------
def generate_frames_yolo(video_path, cam_id):
    q = queue.Queue(maxsize=5)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ No se pudo abrir el video: {video_path}")
        return

    def capture():
        global congestion_counter, previous_positions
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # --- Detección de vehículos ---
            results = model_vehicle(frame)[0]
            slow_count = 0
            vehicle_id = 0
            vehicle_boxes = []

            for box, cls, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
                x1, y1, x2, y2 = map(int, box)
                label_name = results.names[int(cls)].lower()
                conf = float(conf) * 100

                if label_name in ["car", "truck", "bus", "motorbike"]:
                    vehicle_boxes.append((x1, y1, x2, y2))
                    prev = previous_positions[cam_id].get(vehicle_id, (x1, y1, x2, y2))
                    dx = abs((x1 + x2)//2 - (prev[0] + prev[2])//2)
                    dy = abs((y1 + y2)//2 - (prev[1] + prev[3])//2)
                    distance = (dx**2 + dy**2)**0.5

                    if distance < SLOW_THRESHOLD:
                        slow_count += 1

                    previous_positions[cam_id][vehicle_id] = (x1, y1, x2, y2)
                    vehicle_id += 1

                    color = (0, 128, 255)  # naranjo para autos
                    label = f"{label_name} {conf:.1f}%"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                    cv2.rectangle(frame, (x1, y1 - h - 10), (x1 + w, y1), color, -1)
                    cv2.putText(frame, label, (x1, y1 - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)



            # --- Lógica de congestión ---
            if slow_count >= SLOW_VEHICLE_COUNT and vehicle_id >= 5:
                congestion_counter[cam_id] += 1
            else:
                congestion_counter[cam_id] = 0

            if congestion_counter[cam_id] >= CONSECUTIVE_FRAMES:
                cv2.putText(frame, "🚨 CONGESTIÓN 🚨", (50, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4, cv2.LINE_AA)

            ret2, buffer = cv2.imencode(".jpg", frame)
            if ret2 and not q.full():
                q.put(buffer.tobytes())
            time.sleep(0.01)

    threading.Thread(target=capture, daemon=True).start()

    try:
        while True:
            frame = q.get()
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
    finally:
        cap.release()

# ---------------------------
# Endpoint de streaming
# ---------------------------
@app.get("/camera/{cam_id}/stream")
def camera_stream(cam_id: int):
    video_path = camera_videos.get(cam_id)
    if not video_path:
        return Response(status_code=404, content="Cámara no encontrada")
    return StreamingResponse(
        generate_frames_yolo(video_path, cam_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# ---------------------------
# Endpoint para descargar video completo
# ---------------------------
@app.get("/camera/{cam_id}.mp4")
def camera_file(cam_id: int):
    path = camera_videos.get(cam_id)
    if not path:
        return Response(status_code=404, content="Cámara no encontrada")
    return FileResponse(path)

# ---------------------------
# Endpoint para consultar congestión
# ---------------------------
@app.get("/camera/{cam_id}/congestion")
def check_congestion(cam_id: int):
    congested = congestion_counter.get(cam_id, 0) >= CONSECUTIVE_FRAMES
    return {"congestion": congested}
