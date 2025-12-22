from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import time

from app.services.detector import (
    start_camera,
    stop_camera,
    generate_frames,
    VIDEO_PATHS,
    vehicles_in_frame,
    stopped_vehicles,
    track_histories,
    accident_detected,
    assistance_detected,
    cones_detected,
    TARGET_RES
)

camera_router = APIRouter()
status_router = APIRouter()  # Router separado para status

VEHICLE_MEDIUM = 13
VEHICLE_HIGH = 18
TIMEOUT_SEC = 5

_last_assistance_seen = {}
_last_cones_seen = {}

# ---------------------------
# STREAMING
# ---------------------------
@camera_router.get("/cam/{cam_id}/stream")
def stream_camera(cam_id: int):
    start_camera(cam_id)  # Inicia el hilo de la cámara
    return StreamingResponse(
        generate_frames(cam_id),  # Función que entrega frames
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@camera_router.post("/cam/{cam_id}/stop")
def stop_camera_endpoint(cam_id: int):
    stop_camera(cam_id)  # Detiene los hilos de la cámara
    return {"status": f"Cámara {cam_id} detenida"}


@camera_router.get("/cam/{cam_id}/stream_low")
def stream_camera_low(cam_id: int):
    start_camera(cam_id)
    return StreamingResponse(
        generate_frames(cam_id, low=True),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# ---------------------------
# STATUS COMPLETO
# ---------------------------
@status_router.get("/camera/{cam_id}/status_full")
def camera_status_full(cam_id: int):
    global _last_assistance_seen, _last_cones_seen

    if cam_id not in _last_assistance_seen:
        _last_assistance_seen[cam_id] = 0
    if cam_id not in _last_cones_seen:
        _last_cones_seen[cam_id] = 0

    if cam_id not in VIDEO_PATHS:
        raise HTTPException(404, "Cámara no encontrada")


    total_vehiculos = vehicles_in_frame.get(cam_id, 0)

    if total_vehiculos > VEHICLE_HIGH:
        nivel = "Alta"
        nivel_color = "#dc2626"
    elif total_vehiculos > VEHICLE_MEDIUM:
        nivel = "Media"
        nivel_color = "#facc15"
    else:
        nivel = "Baja"
        nivel_color = "#16a34a"

    ids_detenidos = list(stopped_vehicles.get(cam_id, set()))
    num_detenidos = len(ids_detenidos)

    # Personas en vía
    personas_en_via = 0
    ROAD_Y_START = int(0.5 * TARGET_RES[1])
    ROAD_Y_END = TARGET_RES[1]

    for tid, history in track_histories.get(cam_id, {}).items():
        if not history:
            continue
        y = history[-1][1]
        if ROAD_Y_START <= y <= ROAD_Y_END:
            personas_en_via += 1

    accident = accident_detected.get(cam_id, False)

    now = time.time()
    if assistance_detected.get(cam_id):
        _last_assistance_seen[cam_id] = now
    if cones_detected.get(cam_id):
        _last_cones_seen[cam_id] = now

    asistencia_activa = (now - _last_assistance_seen[cam_id]) < TIMEOUT_SEC
    conos_activos = (now - _last_cones_seen[cam_id]) < TIMEOUT_SEC

    alerta_vehiculo = num_detenidos > 0 and not asistencia_activa and not conos_activos

    return {
        "status": "online",
        "vehiculos": total_vehiculos,
        "nivel": nivel,
        "nivel_color": nivel_color,
        "detenidos": num_detenidos,
        "ids_detenidos": ids_detenidos,
        "personas_en_via": personas_en_via,
        "accidente_detectado": accident,
        "asistencia_detectada": asistencia_activa,
        "conos_detectados": conos_activos,
        "alerta_vehiculo": alerta_vehiculo
    }
