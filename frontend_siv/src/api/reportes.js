import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export const fetchIncidentes = async () => {
    const res = await axios.get(`${API_BASE}/incidentes/`);
    return res.data;
};

export const fetchUsuarios = async () => {
    const res = await axios.get(`${API_BASE}/users/`);
    return res.data;
};

export const cerrarIncidenteAPI = async (id) => {
    const res = await axios.patch(`${API_BASE}/incidentes/${id}`, { status: "Cerrado" });
    return res.data;
};
