import os

# =========================================================
# RUTAS BASE
# =========================================================
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(APP_DIR))

# =========================================================
# MODELO YOLO
# =========================================================
YOLO_DIR = os.path.join(BACKEND_DIR, "yolo", "models")
MODEL_PATH = os.path.join(YOLO_DIR, "best.pt")

# =========================================================
# VIDEOS
# =========================================================
VIDEO_DIR = os.path.join(BACKEND_DIR, "videos")
VIDEO_PATHS = {
    1: os.path.join(VIDEO_DIR, "camm.mp4"),


}

# =========================================================
# PARÁMETROS GENERALES
# =========================================================
TRACKER_CONFIG = "bytetrack.yaml"
TARGET_RES = (854, 480)
JPEG_QUALITY = 90
MIN_CONFIDENCE = 0.35
MAX_TRACK_HISTORY = 30

# =========================================================
# DETECCIÓN DE VEHÍCULOS DETENIDOS
# =========================================================
STOP_FRAMES_THRESHOLD = 15
STOP_DISTANCE_THRESHOLD = 3.5

# =========================================================
# COLORES POR CLASE (BGR)
# =========================================================
CLASS_COLORS = {
    "car": (52, 152, 219),
    "bus": (231, 76, 60),
    "camion": (230, 126, 34),
    "truck": (230, 126, 34),
    "furgon": (241, 196, 15),
    "moto": (155, 89, 182),
    "persona": (46, 204, 113),
    "cono": (217, 78, 255),  # naranja
    "asistencia": (149, 165, 166),
    "safety cone": (0, 165, 255)
}


DEFAULT_COLOR = (189, 195, 199)


DEFAULT_COLOR = (200, 200, 200)

# ===============================
# VIDEO
# ===============================
TARGET_RES = (1280, 720)
JPEG_QUALITY = 80
TRACKER_CONFIG = "bytetrack.yaml"

# ===============================
# TRACKING
# ===============================
MAX_TRACK_HISTORY = 30
MIN_CONFIDENCE = 0.4

STOP_FRAMES_THRESHOLD = 15
STOP_DISTANCE_THRESHOLD = 10

STOP_CONFIRM_FRAMES = 8
MOVE_CONFIRM_FRAMES = 5

TIMEOUT_SEC = 5
#/Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/app/core/config.py