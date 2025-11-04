# backend_siv/app/main.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2, queue, time, threading, torch, logging
import numpy as np

app = FastAPI(title="SIV Video - Detección y Tracking de Vehículos y Personas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🎥 Ruta de video
VIDEO_PATH = r"/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/videos/cam2.mp4"

# 🚗 Clases que se van a trackear
TRACK_CLASSES = ["car", "truck", "bus", "motorcycle", "cone", "person"]

# ⚙️ Parámetros
CONF_THRESHOLD = 0.25
SLOW_THRESHOLD = 2       # sensibilidad del movimiento (menor = más sensible)
STOPPED_FRAMES = 10      # cantidad de frames quieto para considerarlo detenido
SLOW_COUNT_TRIGGER = 2   # cantidad de objetos lentos para marcar congestión

logging.basicConfig(level=logging.INFO)
device = "cuda" if torch.cuda.is_available() else "cpu"
logging.info(f"🧠 Usando dispositivo: {device}")

# 🧠 Cargar modelo YOLO
model = YOLO("yolov8n.pt")

frame_queue = queue.Queue(maxsize=5)

# 🔢 Mapas globales de IDs y posiciones
global_id_map = {}
unique_id_counter = 0
vehicle_positions = {}
stopped_frames = {}

# 🎬 Captura de video
def capture_loop():
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        logging.error(f"❌ No se pudo abrir {VIDEO_PATH}")
        return
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        if not frame_queue.full():
            frame_queue.put(frame)
        time.sleep(1/30)

# ✏️ Dibujar etiquetas
def draw_label(frame, text, x1, y1, color=(0,255,0)):
    font_scale = 0.8
    thickness = 2
    ((w,h), _) = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
    cv2.rectangle(frame, (x1, y1-h-8), (x1+w, y1), color, -1)
    cv2.putText(frame, text, (x1, y1-2), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255,255,255), thickness)

# 🧩 Procesamiento de frames
def process_loop():
    global unique_id_counter, global_id_map, vehicle_positions, stopped_frames
    while True:
        if frame_queue.empty():
            time.sleep(0.01)
            continue
        frame = frame_queue.get()
        results = model.track(
            frame,
            conf=CONF_THRESHOLD,
            persist=True,
            tracker="bytetrack.yaml",
            classes=None,
            stream=False
        )
        res = results[0]

        slow_count = 0
        current_ids = []

        boxes = getattr(res, "boxes", None)
        if boxes is None or len(getattr(boxes, "cls", [])) == 0:
            # No hay detecciones
            status_text = "FLUJO NORMAL ✅"
            status_color = (0,255,0)
            cv2.rectangle(frame, (5,5), (400,50), (0,0,0), -1)
            cv2.putText(frame, status_text, (10,35), cv2.FONT_HERSHEY_SIMPLEX, 1.0, status_color, 3)
        else:
            xyxy_list = boxes.xyxy.cpu().numpy() if hasattr(boxes, "xyxy") else []
            cls_list = boxes.cls.cpu().numpy() if hasattr(boxes, "cls") else []
            conf_list = boxes.conf.cpu().numpy() if hasattr(boxes, "conf") else []
            ids = boxes.id if hasattr(boxes, "id") and boxes.id is not None else [None]*len(cls_list)

            for box, cls, conf, tracker_id in zip(xyxy_list, cls_list, conf_list, ids):
                label = res.names[int(cls)].lower()
                if label in ["motorbike", "bike"]:
                    label = "motorcycle"

                if label not in TRACK_CLASSES:
                    continue

                # Asignar ID único si no existe
                if tracker_id is None or tracker_id not in global_id_map:
                    unique_id_counter += 1
                    tracker_id = unique_id_counter
                global_id_map[tracker_id] = tracker_id

                x1, y1, x2, y2 = box.astype(int)
                cx, cy = (x1+x2)//2, (y1+y2)//2

                # 🎨 Colores por tipo
                color_dict = {
                    "car": (0,255,0),
                    "truck": (0,165,255),
                    "bus": (255,0,0),
                    "motorcycle": (255,0,255),
                    "cone": (0,255,255),
                    "person": (200,200,255)
                }
                color = color_dict.get(label, (0,255,0))

                confidence_pct = int(conf*100)

                # 🚶‍♂️ Calcular velocidad y si está detenido
                prev = vehicle_positions.get(tracker_id)
                speed = 999
                stopped = False
                if prev:
                    dx = abs(cx - prev[0])
                    dy = abs(cy - prev[1])
                    speed = np.sqrt(dx**2 + dy**2)
                    if speed <= SLOW_THRESHOLD:
                        stopped_frames[tracker_id] = stopped_frames.get(tracker_id, 0) + 1
                    else:
                        stopped_frames[tracker_id] = 0

                    if stopped_frames[tracker_id] >= STOPPED_FRAMES:
                        stopped = True
                        slow_count += 1
                else:
                    stopped_frames[tracker_id] = 0

                vehicle_positions[tracker_id] = (cx, cy)
                current_ids.append(tracker_id)

                state = "🟥 Detenido" if stopped else "🟩 En movimiento"
                draw_label(frame, f"{label} ID:{tracker_id} {state} {confidence_pct}%", x1, y1, color=color)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Limpiar los que ya no están
        to_del = [vid for vid in vehicle_positions if vid not in current_ids]
        for vid in to_del:
            del vehicle_positions[vid]
            del stopped_frames[vid]

        # 🚦 Estado general
        status_text = "CONGESTIÓN 🚦" if slow_count >= SLOW_COUNT_TRIGGER else "FLUJO NORMAL ✅"
        status_color = (0,0,255) if slow_count >= SLOW_COUNT_TRIGGER else (0,255,0)
        cv2.rectangle(frame, (5,5), (400,50), (0,0,0), -1)
        cv2.putText(frame, status_text, (10,35), cv2.FONT_HERSHEY_SIMPLEX, 1.0, status_color, 3)

        ret2, buffer = cv2.imencode(".jpg", frame)
        if ret2:
            yield_frame = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + yield_frame + b"\r\n")

# 🧠 Generador de frames
def generate_frames():
    if not hasattr(generate_frames, "started"):
        threading.Thread(target=capture_loop, daemon=True).start()
        generate_frames.started = True
    for f in process_loop():
        yield f

# 🚀 Endpoint de streaming
@app.get("/camera/stream")
def camera_stream():
    return StreamingResponse(generate_frames(),
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/")
def root():
    return {"status": "ok", "msg": "Detección y tracking activo ✅"}
