import os
import atexit
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.services.detector import VIDEO_PATHS  # tu diccionario de cámaras

router = APIRouter()

# ===============================
# GRABACIÓN DE INCIDENTES
# ===============================
incident_recording = {cid: False for cid in VIDEO_PATHS}
incident_writer = {cid: None for cid in VIDEO_PATHS}

# Carpeta donde se guardan los incidentes
INCIDENT_DIR = os.path.join(os.path.dirname(__file__), "../../videos/incidentes")
os.makedirs(INCIDENT_DIR, exist_ok=True)

# Limpiar recursos al salir
atexit.register(lambda: [w.release() for w in incident_writer.values() if w])

# ===============================
# RUTAS DE GRABACIONES
# ===============================

@router.get("/grabaciones")
async def listar_grabaciones():
    """
    Lista todas las grabaciones de incidentes disponibles
    """
    try:
        archivos = os.listdir(INCIDENT_DIR)
        archivos.sort(reverse=True)
        return {"grabaciones": archivos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grabaciones/{filename}")
async def obtener_grabacion(filename: str):
    """
    Descarga una grabación específica
    """
    file_path = os.path.join(INCIDENT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)


@router.get("/grabaciones/stream/{filename}")
async def stream_grabacion(filename: str):
    """
    Streaming de una grabación de incidente
    """
    file_path = os.path.join(INCIDENT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    def iterfile():
        with open(file_path, mode="rb") as f:
            chunk = f.read(1024 * 1024)
            while chunk:
                yield chunk
                chunk = f.read(1024 * 1024)

    return StreamingResponse(iterfile(), media_type="video/mp4")


# ===============================
# FUNCIONES AUXILIARES PARA INCIDENTES
# ===============================

def start_incident_recording(cam_id: str, frame):
    """
    Inicia la grabación de un incidente para una cámara específica
    """
    import cv2
    if not incident_recording.get(cam_id):
        incident_recording[cam_id] = True
        filename = f"{cam_id}_{int(cv2.getTickCount()/cv2.getTickFrequency())}.mp4"
        file_path = os.path.join(INCIDENT_DIR, filename)
        height, width = frame.shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        incident_writer[cam_id] = cv2.VideoWriter(file_path, fourcc, 20.0, (width, height))
        return file_path
    return None

def write_incident_frame(cam_id: str, frame):
    """
    Escribe un frame en la grabación de incidente activa
    """
    writer = incident_writer.get(cam_id)
    if writer:
        writer.write(frame)

def stop_incident_recording(cam_id: str):
    """
    Detiene la grabación de incidente para una cámara específica
    """
    writer = incident_writer.get(cam_id)
    if writer:
        writer.release()
        incident_writer[cam_id] = None
    incident_recording[cam_id] = False
