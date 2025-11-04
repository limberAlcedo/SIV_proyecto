# backend_siv/app/main.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import time
import torch
import logging
from collections import deque
import numpy as np

# ---------------------------
# ⚙️ CONFIGURACIÓN BASE
# ---------------------------
app = FastAPI(title="SIV Video - Dashboard Mini Videos Minimalista")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diccionario global para congestión por cámara
congestion_data = {}  # camId -> {"nivel": str, "porcentaje": float, "congestion": bool}

# Parámetros
CAMERAS = {
    1: r"/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/videos/cam1.mp4",
    2: r"/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/videos/cam2.mp4",
}

TRACK_CLASSES = ["car", "truck", "bus", "motorcycle"]
CONF_THRESHOLD = 0.45
DIST_THRESHOLD = 70
MAX_LOST_FRAMES = 25

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
device = "cuda" if torch.cuda.is_available() else "cpu"
logging.info(f"🧠 Usando dispositivo: {device}")

# Modelo YOLO
model = YOLO("yolov8n.pt")

# ---------------------------
# 🧩 FUNCIONES AUXILIARES
# ---------------------------
def iou(bbox1, bbox2):
    x1, y1, x2, y2 = bbox1
    x1b, y1b, x2b, y2b = bbox2
    inter_x1 = max(x1, x1b)
    inter_y1 = max(y1, y1b)
    inter_x2 = min(x2, x2b)
    inter_y2 = min(y2, y2b)
    inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
    area1 = (x2 - x1) * (y2 - y1)
    area2 = (x2b - x1b) * (y2b - y1b)
    union = area1 + area2 - inter_area
    if union > 0:
        return inter_area / union
    return 0

def suprimir_detecciones_similares(detections, umbral_iou=0.6):
    filtradas = []
    for i, d1 in enumerate(detections):
        duplicado = False
        for d2 in filtradas:
            if d1[0] == d2[0]:
                if iou(d1[2], d2[2]) > umbral_iou:
                    duplicado = True
                    break
        if not duplicado:
            filtradas.append(d1)
    return filtradas

def draw_label_centered(frame, text, bbox, color):
    x1, y1, x2, y2 = bbox
    font_scale = 0.6
    thickness = 2
    ((w, h), _) = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
    cx = x1 + (x2 - x1) // 2 - w // 2
    cy = y1 - 10
    cv2.rectangle(frame, (cx - 2, cy - h - 2), (cx + w + 2, cy + 4), color, -1)
    cv2.putText(frame, text, (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)

# ---------------------------
# 🎇 MINI VIDEO MINIMALISTA
# ---------------------------
def draw_mini_congestion_alert(frame, vehiculos_visibles, camId, frame_count, mini_width=320, mini_height=180):
    # Redimensionar a mini video
    mini_frame = cv2.resize(frame, (mini_width, mini_height))

    # Cálculo de congestión (solo para backend)
    total_area = mini_frame.shape[0] * mini_frame.shape[1]
    area_ocupada = sum((x2 - x1)*(y2 - y1) for v in vehiculos_visibles for (x1, y1, x2, y2) in [v["bbox"]])
    count = len(vehiculos_visibles)
    densidad = area_ocupada / total_area
    factor_congestion = (count * 0.25) + (densidad * 3.5)

    # Guardar datos de congestión
    if factor_congestion >= 1.0:
        nivel = "Alta"
    elif factor_congestion >= 0.4:
        nivel = "Media"
    else:
        nivel = "Baja"

    congestion_data[camId] = {
        "nivel": nivel,
        "porcentaje": min(factor_congestion*100, 100),
        "congestion": factor_congestion >= 1.0
    }

    return mini_frame

# ---------------------------
# 🔁 PROCESAMIENTO DE VIDEO
# ---------------------------
def process_video(camId, mini=False):
    cap = cv2.VideoCapture(CAMERAS[camId])
    if not cap.isOpened():
        logging.error(f"No se pudo abrir el video: {CAMERAS[camId]}")
        return

    tracked_objects = {}
    next_id = 0
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        results = model(frame, conf=CONF_THRESHOLD, device=device)
        detections = []

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                label = r.names[cls]
                if label in ["motorbike", "bike"]:
                    label = "motorcycle"
                if label not in TRACK_CLASSES:
                    continue
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                cx, cy = (x1+x2)//2, (y1+y2)//2
                detections.append((label, conf, (x1, y1, x2, y2), (cx, cy)))

        detections = suprimir_detecciones_similares(detections)
        vehiculos_visibles = []
        matched_ids = set()
        claimed_ids = set()

        for label, conf, bbox, center in detections:
            best_id, best_dist = None, float("inf")
            for tid, obj in tracked_objects.items():
                if tid in claimed_ids or obj["label"] != label:
                    continue
                avg_center = obj["centroids"][-1] if obj["centroids"] else center
                dist = np.hypot(center[0]-avg_center[0], center[1]-avg_center[1])
                if dist < DIST_THRESHOLD and dist < best_dist:
                    best_dist, best_id = dist, tid
            if best_id is None:
                next_id += 1
                best_id = next_id
                tracked_objects[best_id] = {"label": label, "centroids": deque(maxlen=10),
                                            "bbox": bbox, "conf": conf, "lost_frames": 0}
            else:
                claimed_ids.add(best_id)
            obj = tracked_objects[best_id]
            obj["centroids"].append(center)
            obj["bbox"] = bbox
            obj["conf"] = conf
            obj["lost_frames"] = 0
            matched_ids.add(best_id)
            vehiculos_visibles.append(obj)
            color_dict = {"car": (0, 255, 0), "truck": (0, 165, 255), "bus": (255, 0, 0), "motorcycle": (255, 0, 255)}
            draw_label_centered(frame, f"{label} ID:{best_id} ({conf*100:.1f}%)", bbox, color_dict.get(label, (255, 255, 255)))

        # Limpiar objetos perdidos
        to_delete = []
        for tid, obj in tracked_objects.items():
            if tid not in matched_ids:
                obj["lost_frames"] += 1
                if obj["lost_frames"] > MAX_LOST_FRAMES:
                    to_delete.append(tid)
        for tid in to_delete:
            del tracked_objects[tid]

        # Dibujar mini o full
        if mini:
            frame_to_send = draw_mini_congestion_alert(frame, vehiculos_visibles, camId, frame_count)
        else:
            draw_mini_congestion_alert(frame, vehiculos_visibles, camId, frame_count,
                                       mini_width=frame.shape[1], mini_height=frame.shape[0])
            frame_to_send = frame

        ret, buffer = cv2.imencode(".jpg", frame_to_send)
        if ret:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

        frame_count += 1
        time.sleep(1/30)

    cap.release()

# ---------------------------
# 🚀 ENDPOINTS
# ---------------------------
@app.get("/camera/{camId}/stream")
def camera_stream(camId: int):
    if camId not in CAMERAS:
        return {"error": "Cámara no encontrada"}
    return StreamingResponse(process_video(camId, mini=False),
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/camera/{camId}/mini")
def camera_mini(camId: int):
    if camId not in CAMERAS:
        return {"error": "Cámara no encontrada"}
    return StreamingResponse(process_video(camId, mini=True),
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/camera/{camId}/congestion")
def camera_congestion(camId: int):
    return congestion_data.get(camId, {"nivel": "Desconocido", "porcentaje": 0, "congestion": False})
