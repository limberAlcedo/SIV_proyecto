import cv2
import time
import threading
import queue
from collections import defaultdict
from ultralytics import YOLO
import os
import atexit
import numpy as np

from backend_siv.app.services.config import (
    VIDEO_PATHS, MODEL_PATH, CLASS_COLORS, DEFAULT_COLOR,
    TARGET_RES, JPEG_QUALITY, TRACKER_CONFIG,
    MAX_TRACK_HISTORY, MIN_CONFIDENCE,
    STOP_FRAMES_THRESHOLD, STOP_DISTANCE_THRESHOLD
)

# ===============================
# ESTADOS EXPORTADOS (FASTAPI)
# ===============================
vehicles_in_frame = {cid: 0 for cid in VIDEO_PATHS}
stopped_vehicles = {cid: set() for cid in VIDEO_PATHS}

accident_detected = {cid: False for cid in VIDEO_PATHS}
assistance_detected = {cid: None for cid in VIDEO_PATHS}
cones_detected = {cid: False for cid in VIDEO_PATHS}

class_counters = {}

# ===============================
# CONTROL DE THREADS POR CÁMARA
# ===============================
active_cams = {}  # cam_id -> (thread_capture, thread_process)
stop_flags = {cid: False for cid in VIDEO_PATHS}  # bandera para detener threads

# ===============================
# PARÁMETROS DE CONFIRMACIÓN
# ===============================
STOP_CONFIRM_FRAMES = 12  # aumentamos de 8 a 12 para mayor robustez
MOVE_CONFIRM_FRAMES = 5

CONES_CONFIRM_FRAMES = 10
ASSIST_CONFIRM_FRAMES = 10
ASSIST_WINDOW_SEC = 6
MAX_TRAIL = 15  # longitud de la estela de vehículos

# ===============================
# ESTADOS GLOBALES
# ===============================
frame_queues = {cid: queue.Queue(maxsize=5) for cid in VIDEO_PATHS}
processed_queues = {cid: queue.Queue(maxsize=2) for cid in VIDEO_PATHS}

track_histories = {cid: defaultdict(list) for cid in VIDEO_PATHS}
vehicle_states = {cid: defaultdict(lambda: "MOVING") for cid in VIDEO_PATHS}

cones_frames = {cid: 0 for cid in VIDEO_PATHS}
assist_frames = {cid: 0 for cid in VIDEO_PATHS}

cones_confirmed = {cid: False for cid in VIDEO_PATHS}
assistance_confirmed = {cid: False for cid in VIDEO_PATHS}
last_cones_time = {cid: 0 for cid in VIDEO_PATHS}

stopped_persistence = {cid: defaultdict(int) for cid in VIDEO_PATHS}
movement_persistence = {cid: defaultdict(int) for cid in VIDEO_PATHS}

# ===============================
# VIDEO OUTPUT
# ===============================
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../videos/generado")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VIDEO_OUTPUT_PATHS = {
    cid: os.path.join(OUTPUT_DIR, f"cam{cid}_output.mp4")
    for cid in VIDEO_PATHS
}


# ===============================
# GRABACIÓN DE INCIDENTES
# ===============================
incident_recording = {cid: False for cid in VIDEO_PATHS}
incident_writer = {cid: None for cid in VIDEO_PATHS}
INCIDENT_DIR = os.path.join(os.path.dirname(__file__), "../../videos/incidentes")
os.makedirs(INCIDENT_DIR, exist_ok=True)


video_writers = {}
atexit.register(lambda: [w.release() for w in video_writers.values()])
incident_recording = {cid: False for cid in VIDEO_PATHS}
incident_writer = {cid: None for cid in VIDEO_PATHS}
INCIDENT_DIR = os.path.join(os.path.dirname(__file__), "../../videos/incidentes")
os.makedirs(INCIDENT_DIR, exist_ok=True)


# ===============================
# MODELO YOLO
# ===============================
model = YOLO(MODEL_PATH)
print("✅ Modelo YOLO cargado → clases:", model.names)
model_lock = threading.Lock()

# ===============================
# UTILIDADES VISUALES
# ===============================
def get_color(class_name):
    return CLASS_COLORS.get(class_name.lower(), DEFAULT_COLOR)

def draw_label(frame, box, label, color, confidence=None, alert=False, hide_confidence=False):
    x1, y1, x2, y2 = map(int, box)
    if confidence is not None and not hide_confidence:
        label = f"{label} {confidence:.2f}"

    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.8
    thickness = 2
    pad = 4

    (w, h), _ = cv2.getTextSize(label, font, scale, thickness)
    y_text = max(y1 - h - 6, 0)

    overlay = frame.copy()
    bg = (0, 0, 255) if alert else color
    alpha = 0.6

    cv2.rectangle(
        overlay,
        (x1, y_text),
        (x1 + w + pad * 2, y_text + h + pad * 2),
        bg,
        -1
    )
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    cv2.putText(
        frame,
        label,
        (x1 + pad, y_text + h + pad),
        font,
        scale,
        (255, 255, 255),
        thickness,
        cv2.LINE_AA
    )

# ===============================
# DETECCIÓN DE DETENIDOS + ESTELA
# ===============================
def update_stopped_vehicles(cam_id, current_ids):
    nuevos_detenidos = set()
    for tid in current_ids:
        history = track_histories[cam_id][tid]
        if len(history) < STOP_FRAMES_THRESHOLD:
            continue
        x0, y0 = history[-STOP_FRAMES_THRESHOLD]
        x1, y1 = history[-1]
        dist = ((x1 - x0)**2 + (y1 - y0)**2)**0.5
        state = vehicle_states[cam_id][tid]

        if dist < STOP_DISTANCE_THRESHOLD:
            movement_persistence[cam_id][tid] = 0
            if state == "MOVING":
                stopped_persistence[cam_id][tid] += 1
                if stopped_persistence[cam_id][tid] >= STOP_CONFIRM_FRAMES:
                    vehicle_states[cam_id][tid] = "STOPPED_CONFIRMED"
            if vehicle_states[cam_id][tid] == "STOPPED_CONFIRMED":
                nuevos_detenidos.add(tid)
        else:
            stopped_persistence[cam_id][tid] = 0
            if state == "STOPPED_CONFIRMED":
                movement_persistence[cam_id][tid] += 1
                if movement_persistence[cam_id][tid] >= MOVE_CONFIRM_FRAMES:
                    vehicle_states[cam_id][tid] = "MOVING"

    stopped_vehicles[cam_id] = nuevos_detenidos

def draw_trails(frame, cam_id):
    for tid, history in track_histories[cam_id].items():
        color = (0, 255, 255)  # color de la estela
        points = history[-MAX_TRAIL:]
        for i in range(1, len(points)):
            cv2.line(frame, points[i-1], points[i], color, 2)

# ===============================
# CAPTURA DE VIDEO
# ===============================
def capture_video(cam_id):
    cap = cv2.VideoCapture(VIDEO_PATHS[cam_id])
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    delay = 1 / fps

    while not stop_flags[cam_id]:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        if frame_queues[cam_id].full():
            frame_queues[cam_id].get_nowait()
        frame_queues[cam_id].put(frame)
        time.sleep(delay)
    cap.release()


def start_incident_recording(cam_id, fps, frame):
    if incident_recording[cam_id]:
        return
    filename = f"cam{cam_id}_incident_{int(time.time())}.mp4"
    path = os.path.join(INCIDENT_DIR, filename)
    writer = cv2.VideoWriter(
        path,
        cv2.VideoWriter_fourcc(*"avc1"),
        fps,
        (frame.shape[1], frame.shape[0])
    )
    incident_writer[cam_id] = writer
    incident_recording[cam_id] = True
    print(f"🎬 Grabando incidente cámara {cam_id} → {filename}")

def stop_incident_recording(cam_id):
    if not incident_recording[cam_id]:
        return
    incident_writer[cam_id].release()
    incident_writer[cam_id] = None
    incident_recording[cam_id] = False
    print(f"⏹️ Incidente cámara {cam_id} finalizado")


# ===============================
# PROCESAMIENTO DE FRAMES
# ===============================
# ===============================
# PROCESAMIENTO DE FRAMES
# ===============================
def process_frames(cam_id, fps):
    writer = cv2.VideoWriter(
        VIDEO_OUTPUT_PATHS[cam_id],
        cv2.VideoWriter_fourcc(*"avc1"),
        fps,
        TARGET_RES
    )
    video_writers[cam_id] = writer

    EXCLUDE_ALERT_LABELS = {"persona", "cono", "asistencia"}

    # Cooldown para incidentes
    incident_cooldown = 0
    MIN_INCIDENT_FRAMES = 15  # sigue grabando aunque desaparezca el evento

    while not stop_flags[cam_id]:
        frame = frame_queues[cam_id].get()
        clean_frame = frame.copy()  # copia para grabar sin etiquetas
        padded = cv2.copyMakeBorder(frame, 20, 20, 20, 20, cv2.BORDER_CONSTANT)

        with model_lock:
            results = model.track(
                padded,
                persist=True,
                tracker=TRACKER_CONFIG
            )[0]

        annotated = frame.copy()
        current_ids = set()
        detected_classes = set()

        assistance_detected[cam_id] = None
        cones_detected[cam_id] = False

        boxes = results.boxes
        if boxes and boxes.id is not None:
            for box, tid, cls, conf in zip(
                boxes.xyxy.cpu().numpy(),
                boxes.id.int().cpu().tolist(),
                boxes.cls.int().cpu().tolist(),
                boxes.conf.cpu().numpy()
            ):
                class_name = model.names[int(cls)].lower()
                detected_classes.add(class_name)

                cx = int((box[0] + box[2]) / 2)
                cy = int((box[1] + box[3]) / 2)
                track_histories[cam_id][tid].append((cx, cy))
                if len(track_histories[cam_id][tid]) > MAX_TRACK_HISTORY:
                    track_histories[cam_id][tid].pop(0)

                state = vehicle_states[cam_id][tid]
                base_color = get_color(class_name)

                # Confirmación asistencia / conos
                if class_name == "asistencia":
                    assist_frames[cam_id] += 1
                    if assist_frames[cam_id] >= ASSIST_CONFIRM_FRAMES:
                        assistance_confirmed[cam_id] = True
                        assistance_detected[cam_id] = "Asistencia"
                elif class_name == "cono":
                    cones_frames[cam_id] += 1
                    if cones_frames[cam_id] >= CONES_CONFIRM_FRAMES:
                        cones_confirmed[cam_id] = True
                        cones_detected[cam_id] = True

                # Bloqueo alertas
                block_alerts = assistance_confirmed[cam_id] or cones_confirmed[cam_id]

                current_ids.add(tid)
                vehicles_in_frame[cam_id] = len(current_ids)

                hide_conf = class_name in {"persona", "cono", "asistencia"}
                label_text = class_name.capitalize()
                show_alert = state == "STOPPED_CONFIRMED" and not block_alerts and class_name not in EXCLUDE_ALERT_LABELS

                if show_alert:
                    draw_label(annotated, box, label_text, (0, 0, 255), confidence=conf, alert=True, hide_confidence=hide_conf)
                else:
                    draw_label(annotated, box, label_text, base_color, confidence=conf, hide_confidence=hide_conf)

        update_stopped_vehicles(cam_id, current_ids)
        draw_trails(annotated, cam_id)  # dibujar estelas

        # ===============================
        # GRABAR VIDEO DE INCIDENTE
        # ===============================
        incident = bool(
            stopped_vehicles[cam_id] or
            assistance_confirmed[cam_id] or
            cones_confirmed[cam_id]
        )

        if incident:
            incident_cooldown = 0
            start_incident_recording(cam_id, fps, clean_frame)
            incident_writer[cam_id].write(clean_frame)
        else:
            if incident_recording[cam_id]:
                incident_cooldown += 1
                if incident_cooldown >= MIN_INCIDENT_FRAMES:
                    stop_incident_recording(cam_id)
                else:
                    # seguimos grabando aunque el evento desaparezca momentáneamente
                    incident_writer[cam_id].write(clean_frame)

        # Limpiar tracks de IDs no presentes
        for tid in list(vehicle_states[cam_id].keys()):
            if tid not in current_ids:
                vehicle_states[cam_id].pop(tid, None)
                stopped_persistence[cam_id].pop(tid, None)
                movement_persistence[cam_id].pop(tid, None)
                track_histories[cam_id].pop(tid, None)

        if "asistencia" not in detected_classes:
            assist_frames[cam_id] = 0
            assistance_confirmed[cam_id] = False
            assistance_detected[cam_id] = None
        if "cono" not in detected_classes:
            cones_frames[cam_id] = 0
            cones_confirmed[cam_id] = False
            cones_detected[cam_id] = False

        # Video completo con labels/estelas para streaming
        writer.write(annotated)
        ok, jpg = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
        if ok:
            if processed_queues[cam_id].full():
                processed_queues[cam_id].get_nowait()
            processed_queues[cam_id].put(jpg.tobytes())


# ===============================
# STREAM (LOW / HIGH QUALITY)
# ===============================
def generate_frames(cam_id: int, low: bool = False):
    """
    low = True  -> mini video (baja calidad / rápido)
    low = False -> fullscreen (calidad normal)
    """

    while True:
        frame = processed_queues[cam_id].get()

        if low:
            # MINI VIDEO
            img = cv2.imdecode(
                np.frombuffer(frame, np.uint8),
                cv2.IMREAD_COLOR
            )
            img = cv2.resize(img, (640, 360))
            _, buffer = cv2.imencode(
                ".jpg",
                img,
                [cv2.IMWRITE_JPEG_QUALITY, 45]
            )
            data = buffer.tobytes()
        else:
            # FULLSCREEN (tal cual lo tenías)
            data = frame

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            data +
            b"\r\n"
        )

# INICIAR Y DETENER CAMARAS
# ===============================
def start_camera(cam_id):
    """Inicia hilos de captura y procesamiento"""
    if cam_id in active_cams:
        return

    stop_flags[cam_id] = False
    cap = cv2.VideoCapture(VIDEO_PATHS[cam_id])
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cap.release()

    t1 = threading.Thread(target=capture_video, args=(cam_id,), daemon=True)
    t2 = threading.Thread(target=process_frames, args=(cam_id, fps), daemon=True)
    t1.start()
    t2.start()
    active_cams[cam_id] = (t1, t2)

def stop_camera(cam_id):
    """Detiene hilos de captura y procesamiento"""
    stop_flags[cam_id] = True
    if cam_id in active_cams:
        t1, t2 = active_cams[cam_id]
        t1.join()
        t2.join()
        del active_cams[cam_id]

# ===============================
# MAIN (solo para pruebas locales)
# ===============================
if __name__ == "__main__":
    print("🚀 Sistema listo — detección de VEHÍCULOS DETENIDOS, Asistencia y Conos")
    while True:
        time.sleep(1)
