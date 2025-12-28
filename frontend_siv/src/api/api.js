// src/api.js
import axios from "axios";

// ==========================
// URL BASE DE LA API
// ==========================
export const API_URL = import.meta.env.VITE_API_URL || "http://3.93.58.208:8000";
const API_BASE = API_URL; // Base general para todas las rutas

// ==========================
// CONFIGURAR AXIOS CON TOKEN
// ==========================
const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

// Interceptor: agrega token a cada request automáticamente
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ==========================
// AUTENTICACIÓN / LOGIN
// ==========================
export const loginUser = async (user) => {
    try {
        const res = await axiosInstance.post("/api/auth/login", user);
        return res.data; // { access_token, token_type, user }
    } catch (err) {
        console.error("Error login:", err.response?.data || err.message);
        throw err;
    }
};


// ===== CAMARAS =====
export async function getCameraStatus(camId) {
    const res = await fetch(`${BACKEND_URL}/api/camera/${camId}/status_full`);
    if (!res.ok) throw new Error("Error al obtener estado de la cámara");
    return res.json();
}

export async function startCamera(camId) {
    await fetch(`${BACKEND_URL}/api/camara/${camId}/start`, { method: "POST" });
}

export async function stopCamera(camId) {
    await fetch(`${BACKEND_URL}/api/camara/${camId}/stop`, { method: "POST" });
}


// ==========================
// INCIDENTES
// ==========================
export const fetchIncidentes = async () => {
    try {
        const res = await axiosInstance.get("/api/incidentes/");
        return res.data;
    } catch (err) {
        console.error("Error fetching incidentes:", err.response?.data || err.message);
        throw err;
    }
};

// Cerrar incidente (PATCH)
export const cerrarIncidenteAPI = async (incidente_id, endDate, endTime) => {
    try {
        const res = await axiosInstance.patch(`/api/incidentes/cerrar/${incidente_id}/`, {
            end_date: endDate,
            end_time: endTime,
            close_by_id: JSON.parse(localStorage.getItem("user"))?.id,
        });
        return res.data;
    } catch (err) {
        console.error("Error cerrando incidente:", err.response?.data || err.message);
        throw err;
    }
};

// ==========================
// USUARIOS
// ==========================
export const fetchUsuarios = async () => {
    try {
        const res = await axiosInstance.get("/api/users/");
        return res.data;
    } catch (err) {
        console.error("Error fetching usuarios:", err.response?.data || err.message);
        throw err;
    }
};

// ==========================
// PRIORIDADES
// ==========================
export const fetchPrioridades = async () => {
    try {
        const res = await axiosInstance.get("/api/incidentes/prioridad/");
        return res.data; // [{name:"Alta", value:10}, ...]
    } catch (err) {
        console.error("Error fetching prioridades:", err.response?.data || err.message);
        throw err;
    }
};

// ==========================
// VIDEOS / GRABACIONES
// ==========================
export const fetchVideos = async () => {
    try {
        const res = await axiosInstance.get("/api/videos/");
        return res.data.map(v => ({
            id: v.filename || `video-${Math.random()}`,
            cameraName: v.camera_id ? `Cámara ${v.camera_id}` : "Manual",
            type: v.event_type || "manual",
            date: v.upload_time ? v.upload_time.slice(0, 10) : "",
            startTime: v.upload_time ? v.upload_time.slice(11, 16) : "",
            fullDateTime: v.upload_time || "",
            username: v.username || "Desconocido",
            filename: v.filename || "video_desconocido.mp4",
            url: v.filename ? `${API_URL}/videos/${v.filename}` : ""
        }));
    } catch (err) {
        console.error("Error fetching videos:", err.response?.data || err.message);
        throw err;
    }
};
