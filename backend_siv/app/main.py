# backend_siv/app/main.py
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import cv2, threading, queue, time
from collections import defaultdict

app = FastAPI(title="SIV 2.0 Backend")

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Modelos YOLO
# ---------------------------
model_vehicle = YOLO("yolov8n.pt")  # vehículos y personas

# ---------------------------
# Videos de cámaras
# ---------------------------
camera_videos = {
    1: "videos/cam1.mp4",
    2: "videos/cam2.mp4",
    3: "videos/cam3.mp4",
    4: "videos/cam4.mp4",
    5: "videos/cam5.mp4",
    6: "videos/cam6.mp4",
    7: "videos/cam7.mp4",
    8: "videos/cam8.mp4",
}

# ---------------------------
# Variables de seguimiento
# ---------------------------
SLOW_THRESHOLD = 5
SLOW_VEHICLE_COUNT = 3
CONSECUTIVE_FRAMES = 3
previous_positions = defaultdict(dict)
congestion_counter = defaultdict(int)
incident_memory = defaultdict(list)  # incidentes recientes en memoria

# ---------------------------
# Streaming + detección YOLO
# ---------------------------
def generate_frames_yolo(video_path, cam_id):
    q = queue.Queue(maxsize=5)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ No se pudo abrir el video: {video_path}")
        return

    def capture():
        global congestion_counter, previous_positions, incident_memory
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            results = model_vehicle(frame)[0]
            slow_count = 0
            vehicle_id = 0

            for box, cls, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
                x1, y1, x2, y2 = map(int, box)
                label_name = results.names[int(cls)].lower()
                conf = float(conf) * 100

                if label_name in ["car", "truck", "bus", "motorbike"]:
                    prev = previous_positions[cam_id].get(vehicle_id, (x1, y1, x2, y2))
                    dx = abs((x1 + x2)//2 - (prev[0] + prev[2])//2)
                    dy = abs((y1 + y2)//2 - (prev[1] + prev[3])//2)
                    distance = (dx**2 + dy**2)**0.5

                    if distance < SLOW_THRESHOLD:
                        slow_count += 1

                    previous_positions[cam_id][vehicle_id] = (x1, y1, x2, y2)
                    vehicle_id += 1

                    # Bounding box
                    color = (0, 128, 255)
                    label = f"{label_name} {conf:.1f}%"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                    cv2.rectangle(frame, (x1, y1 - h - 10), (x1 + w, y1), color, -1)
                    cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

            # Lógica de congestión
            if slow_count >= SLOW_VEHICLE_COUNT and vehicle_id >= 5:
                congestion_counter[cam_id] += 1
            else:
                congestion_counter[cam_id] = 0

            if congestion_counter[cam_id] >= CONSECUTIVE_FRAMES:
                cv2.putText(frame, "🚨 CONGESTIÓN 🚨", (50, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
                incident_memory[cam_id].append({"tipo": "congestion", "timestamp": time.time()})

            ret2, buffer = cv2.imencode(".jpg", frame)
            if ret2 and not q.full():
                q.put(buffer.tobytes())
            time.sleep(0.01)

    threading.Thread(target=capture, daemon=True).start()

    while True:
        frame = q.get()
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"

# ---------------------------
# Endpoints
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

@app.get("/camera/{cam_id}/congestion")
def check_congestion(cam_id: int):
    congested = congestion_counter.get(cam_id, 0) >= CONSECUTIVE_FRAMES
    return {"congestion": congested}

@app.get("/camera/{cam_id}/alerts")
def get_alerts(cam_id: int):
    # últimos 5 incidentes
    return {"alerts": incident_memory.get(cam_id, [])[-5:]}
