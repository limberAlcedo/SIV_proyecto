# backend_siv/app/flask_yolo_multi_heatmap.py
from flask import Flask, Response
from ultralytics import YOLO
import cv2
from threading import Thread
import queue
import time
import numpy as np
import torch

app = Flask(__name__)

# ---------------------------
# Configuración modelo YOLO
# ---------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
print("Usando dispositivo:", device)

model = YOLO("yolov8n.pt")  # modelo ligero y rápido
conf_threshold = 0.4

# ---------------------------
# Configuración de cámaras
# ---------------------------
video_paths = {
    1: "backend_siv/videos/cam1.mp4",
    2: "backend_siv/videos/cam2.mp4",
    3: "backend_siv/videos/cam3.mp4",
    4: "backend_siv/videos/cam4.mp4",
}

frame_queues = {cam_id: queue.Queue(maxsize=3) for cam_id in video_paths}
output_frames = {cam_id: None for cam_id in video_paths}

# ---------------------------
# Colores y grosor por clase
# ---------------------------
COLORS = {
    "person": (0, 255, 255),
    "car": (0, 255, 0),
    "truck": (255, 128, 0),
    "bus": (255, 0, 0),
    "motorbike": (0, 128, 255),
    "bicycle": (128, 0, 255),
    "traffic cone": (255, 255, 0),
    "default": (128, 128, 128)
}

THICKNESS = {
    "person": 2,
    "car": 2,
    "truck": 3,
    "bus": 3,
    "motorbike": 2,
    "bicycle": 2,
    "traffic cone": 2,
    "default": 2
}

GRID_SIZE = (8, 8)  # tamaño del heatmap (filas x columnas)

# ---------------------------
# Captura de video por cámara
# ---------------------------
def capture_frames(cam_id):
    cap = cv2.VideoCapture(video_paths[cam_id])
    if not cap.isOpened():
        print(f"❌ No se pudo abrir la cámara {cam_id}")
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
# Procesamiento YOLO + Heatmap
# ---------------------------
def process_frames(cam_id):
    global output_frames
    while True:
        if not frame_queues[cam_id].empty():
            frame = frame_queues[cam_id].get()
            h, w, _ = frame.shape
            results = model.predict(frame, imgsz=640, conf=conf_threshold, device=device)
            
            # Contador de objetos para heatmap
            heatmap_grid = np.zeros(GRID_SIZE, dtype=int)
            
            for r in results:
                boxes = r.boxes.xyxy.cpu().numpy()
                classes = r.boxes.cls.cpu().numpy()
                confidences = r.boxes.conf.cpu().numpy()
                
                for box, cls, conf in zip(boxes, classes, confidences):
                    x1, y1, x2, y2 = map(int, box[:4])
                    class_name = model.names[int(cls)]
                    
                    # Bounding box
                    color = COLORS.get(class_name, COLORS["default"])
                    thickness = THICKNESS.get(class_name, 2)
                    label = f"{class_name} {conf*100:.1f}%"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
                    (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                    cv2.rectangle(frame, (x1, y1 - text_h - 6), (x1 + text_w, y1), color, -1)
                    cv2.putText(frame, label, (x1, y1 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    
                    # Asignar a celda del heatmap
                    cell_x = min(GRID_SIZE[1]-1, int((x1 + x2)/2 / w * GRID_SIZE[1]))
                    cell_y = min(GRID_SIZE[0]-1, int((y1 + y2)/2 / h * GRID_SIZE[0]))
                    heatmap_grid[cell_y, cell_x] += 1
            
            # Crear heatmap visual
            heatmap = cv2.resize(heatmap_grid.astype(np.float32), (w, h), interpolation=cv2.INTER_NEAREST)
            heatmap = np.clip(heatmap / heatmap.max() if heatmap.max() > 0 else heatmap, 0, 1)
            heatmap_color = cv2.applyColorMap((heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET)
            overlay = cv2.addWeighted(frame, 0.7, heatmap_color, 0.3, 0)
            
            output_frames[cam_id] = overlay
            time.sleep(1/15)
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
# Endpoint congestión en tiempo real
# ---------------------------
@app.route('/camera/<int:cam_id>/congestion')
def congestion(cam_id):
    if cam_id not in video_paths:
        return {"error": "Cámara no encontrada"}, 404
    frame = output_frames.get(cam_id)
    congested = False
    if frame is not None:
        results = model.predict(frame, imgsz=640, conf=conf_threshold, device=device)
        counts = {name: 0 for name in ["person", "car", "truck", "bus", "motorbike", "bicycle", "traffic cone"]}
        for r in results:
            classes = r.boxes.cls.cpu().numpy()
            for cls in classes:
                cname = model.names[int(cls)]
                if cname in counts:
                    counts[cname] += 1
        
        total_vehicles = sum([counts[obj] for obj in ["car","truck","bus","motorbike","bicycle","traffic cone"]])
        if total_vehicles >= 5 or counts["person"] >= 10:
            congested = True
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
    print("🚀 Servidor Flask con heatmap corriendo en http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, threaded=True)
