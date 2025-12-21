import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";
const TOKEN = localStorage.getItem("token");

// ==========================
// CONFIG AXIOS CON TOKEN
// ==========================
const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
        Authorization: TOKEN ? `Bearer ${TOKEN}` : ""
    }
});

// ==========================
// INCIDENTES
// ==========================
export const fetchIncidentes = async () => {
    try {
        const res = await axiosInstance.get("/incidentes/");
        return res.data;
    } catch (err) {
        console.error("Error fetching incidentes:", err.response?.data || err.message);
        throw err;
    }
};

// ==========================
// USUARIOS
// ==========================
export const fetchUsuarios = async () => {
    try {
        const res = await axiosInstance.get("/users/");
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
        const res = await axiosInstance.get("/incidentes/prioridad/");
        return res.data; // [{name:"Alta", value:10}, ...]
    } catch (err) {
        console.error("Error fetching prioridades:", err.response?.data || err.message);
        throw err;
    }
};

// ==========================
// CERRAR INCIDENTE
// ==========================
export const cerrarIncidenteAPI = async (incidente_id, endDate, endTime) => {
    try {
        const res = await axiosInstance.patch(`/incidentes/cerrar/${incidente_id}/`, {
            end_date: endDate,
            end_time: endTime,
            close_by_id: JSON.parse(localStorage.getItem("user"))?.id
        });
        return res.data;
    } catch (err) {
        console.error("Error cerrando incidente:", err.response?.data || err.message);
        throw err;
    }
};
