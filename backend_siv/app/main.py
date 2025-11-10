# backend_siv/app/yolo_server_tracking.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import threading
import queue
import time
import logging
import numpy as np
from collections import defaultdict
import random
from typing import Dict, Tuple

# ---------------------------
# CONFIGURACIÓN
# ---------------------------
CAMERAS: Dict[int, str] = {
    1: r"/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/videos/cam1.mp4",
    2: r"/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/videos/cam2.mp4",
}
TARGET_RES: Tuple[int, int] = (854, 480)
JPEG_QUALITY: int = 90
FRAME_DELAY: float = 1/30  # simula 30 FPS

TRACKER_CONFIG = "bytetrack.yaml"  # tracker de YOLOv8

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ---------------------------
# FASTAPI
# ---------------------------
app = FastAPI(title="YOLOv8 Tracking IDs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# VARIABLES GLOBALES
# ---------------------------
model = YOLO("yolo11n.pt")  # modelo YOLOv11 pequeño
frame_queues: Dict[int, queue.Queue] = {cam_id: queue.Queue(maxsize=10) for cam_id in CAMERAS}
id_colors: Dict[int, Tuple[int,int,int]] = {}
track_history: Dict[int, list] = defaultdict(list)

# ---------------------------
# FUNCIONES AUXILIARES
# ---------------------------
def get_color_for_id(obj_id: int) -> Tuple[int,int,int]:
    if obj_id not in id_colors:
        id_colors[obj_id] = tuple(random.randint(0,255) for _ in range(3))
    return id_colors[obj_id]

def draw_label(frame: np.ndarray, text: str, box: Tuple[int,int,int,int], color=(0,255,0)):
    x1, y1, x2, y2 = map(int, box)
    cv2.rectangle(frame, (x1,y1),(x2,y2), color, 2)
    cv2.putText(frame, text, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

# ---------------------------
# CAPTURA DE VIDEO
# ---------------------------
def capture_video(cam_id: int, video_path: str):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logging.error(f"No se puede abrir el video de la cámara {cam_id}")
        return
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = cv2.resize(frame, TARGET_RES)
        if frame_queues[cam_id].full():
            try:
                frame_queues[cam_id].get_nowait()
            except queue.Empty:
                pass
        frame_queues[cam_id].put(frame)
        time.sleep(0.001)

# ---------------------------
# TRACKING DE FRAMES
# ---------------------------
def track_frame(cam_id: int):
    while True:
        if frame_queues[cam_id].empty():
            time.sleep(0.001)
            continue
        while frame_queues[cam_id].qsize() > 1:
            try:
                frame_queues[cam_id].get_nowait()
            except queue.Empty:
                break
        frame = frame_queues[cam_id].get()

        results = model.track(frame, tracker=TRACKER_CONFIG, persist=True)[0]

        # Dibujar boxes con IDs
        if results.boxes.id is not None:
            for box, obj_id, cls in zip(results.boxes.xyxy, results.boxes.id, results.boxes.cls):
                obj_id = int(obj_id)
                cls_name = model.names[int(cls)]
                color = get_color_for_id(obj_id)
                draw_label(frame, f"{cls_name} ID:{obj_id}", box, color)

                # Guardar historial de tracking
                track_history[obj_id].append(((box[0]+box[2])/2, (box[1]+box[3])/2))

        # Codificar imagen para streaming
        ret, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
        if ret:
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            time.sleep(FRAME_DELAY)

# ---------------------------
# GENERADOR DE FRAMES
# ---------------------------
def generate_frames(cam_id: int):
    if not hasattr(generate_frames, f"started_{cam_id}"):
        threading.Thread(target=capture_video, args=(cam_id,CAMERAS[cam_id]), daemon=True).start()
        setattr(generate_frames, f"started_{cam_id}", True)
    for f in track_frame(cam_id):
        yield f

# ---------------------------
# ENDPOINTS
# ---------------------------
@app.get("/")
def root():
    return {"status":"ok","msg":"Tracking ID activo ✅"}

@app.get("/camera/{cam_id}/stream")
def camera_stream(cam_id:int):
    if cam_id not in CAMERAS:
        raise HTTPException(status_code=404, detail="Cámara no configurada")
    return StreamingResponse(generate_frames(cam_id), media_type="multipart/x-mixed-replace; boundary=frame")
